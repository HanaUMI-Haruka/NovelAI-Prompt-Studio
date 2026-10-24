import { expect, it } from 'vitest';
import { createBackup, parseBackup, planRestore, commitRestore } from './backup';
import type { BackupData } from './backup';
import { createDraft, STORAGE_KEY } from './storage';
import { createLibraryPreferences, LIBRARY_STORAGE_KEY } from './libraryPreferences';
import { APPEARANCE_KEY } from './appearance';
import { SORT_SETTINGS_KEY } from './sortPreferences';
import { createPersonalPreferences, PERSONAL_STORAGE_KEY, savePersonalTag } from './personalTags';

const data = (): BackupData => ({ draft: { ...createDraft(), selectedTagIds: ['silver-hair', 'db:unseen_tag'], tagWeights: { 'silver-hair': 0, 'db:unseen_tag': 1.7 }, customPositive: '  moonlight\nclouds ', negativePrompt: '' }, library: createLibraryPreferences(), theme: 'ocean', sort: { key: 'pinyin', direction: 'desc', selectedFirst: true } });
const options = { mode: 'merge' as const, restoreDraft: false, restoreSettings: false };
let sequence = 0; const id = () => `new-${++sequence}`;
it('备份往返保留顺序、0权重、原始文本、收藏及设置，不包含全库', () => {
  const value = data(); const file = createBackup(value);
  expect(parseBackup(JSON.stringify(file)).data).toEqual(value);
  expect(Object.keys(file).sort()).toEqual(['data', 'exportedAt', 'format', 'version']);
  expect(parseBackup('\uFEFF' + JSON.stringify(file)).data).toEqual(value);
});
it('损坏、未来版本、未知草稿标签和无效设置拒绝导入，不静默回退', () => {
  expect(() => parseBackup('{bad')).toThrow();
  const file = createBackup(data());
  expect(() => parseBackup(JSON.stringify({ ...file, version: 99 }))).toThrow();
  expect(() => parseBackup(JSON.stringify({ ...file, data: { ...file.data, theme: 'unknown' } }))).toThrow();
  expect(() => parseBackup(JSON.stringify({ ...file, data: { ...file.data, draft: { ...file.data.draft, selectedTagIds: ['unknown'] } } }))).toThrow();
  expect(() => parseBackup(JSON.stringify({ ...file, data: { ...file.data, sort: { key: 'smart', direction: 'asc', selectedFirst: false } } }))).toThrow();
});
it('默认合并同名收藏夹并去重，保留当前草稿、引用门槛、主题和排序', () => {
  const current = data(), incoming = data();
  current.library.folders[0].tagIds = ['a']; incoming.library.folders[0].id = 'different'; incoming.library.folders[0].tagIds = ['a', 'b'];
  incoming.draft.customPositive = 'new'; incoming.theme = 'sky'; incoming.library.usage.minimum = 10000;
  const next = planRestore(current, incoming, options, id);
  expect(next.library.folders).toHaveLength(1); expect(next.library.folders[0].id).toBe('default');
  expect(next.library.folders[0].tagIds).toEqual(['a', 'b']); expect(next.draft).toEqual(current.draft);
  expect(next.library.usage).toEqual(current.library.usage); expect(next.theme).toBe('ocean');
  expect(current.library.folders[0].tagIds).toEqual(['a']);
});
it('相同组合跳过，同名不同内容保留两份，重复合并不继续复制', () => {
  const current = data(), incoming = data();
  current.library.folders[0].chunks = [{ id: 'chunk-a', name: '角色', selectedTagIds: ['a'], tagWeights: { a: 0 } }];
  incoming.library.folders[0].chunks = [{ id: 'chunk-a', name: '角色', selectedTagIds: ['b'], tagWeights: { b: .8 } }];
  const first = planRestore(current, incoming, options, id);
  expect(first.library.folders[0].chunks.map(x => x.name)).toEqual(['角色', '角色（导入 2）']);
  expect(first.library.folders[0].chunks[1].id).not.toBe('chunk-a');
  expect(planRestore(first, incoming, options, id).library.folders[0].chunks).toHaveLength(2);
});
it('导入不同名收藏夹即使原ID冲突也不覆盖原夹，长组合名称后缀保持合法', () => {
  const current = data(), incoming = data(); incoming.library.folders[0].name = '新夹';
  const long = '字'.repeat(60);
  current.library.folders[0].chunks = [{ id: 'x', name: long, selectedTagIds: ['a'], tagWeights: {} }];
  incoming.library.folders.push({ id: 'second', name: '默认收藏', tagIds: [], chunks: [{ id: 'y', name: long, selectedTagIds: ['b'], tagWeights: {} }] });
  const next = planRestore(current, incoming, options, id);
  expect(new Set(next.library.folders.map(x => x.id)).size).toBe(2);
  expect([...next.library.folders[0].chunks[1].name].length).toBeLessThanOrEqual(60);
});
it('替换收藏以及恢复草稿、设置的选择互相独立', () => {
  const current = data(), incoming = data(); incoming.library.folders = []; incoming.theme = 'sky'; incoming.draft.customPositive = 'imported'; incoming.library.usage.minimum = 100;
  const next = planRestore(current, incoming, { mode: 'replace', restoreDraft: true, restoreSettings: true }, id);
  expect(next).toEqual(incoming);
  expect(planRestore(current, incoming, { ...options, mode: 'replace' }, id).draft).toEqual(current.draft);
});
function storage(failAt = '', rollbackFails = false) {
  const values = new Map([[STORAGE_KEY, 'old-draft'], [LIBRARY_STORAGE_KEY, 'old-library'], [APPEARANCE_KEY, 'old-theme'], [SORT_SETTINGS_KEY, 'old-sort']]);
  let failed = false;
  return { values, getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => { values.delete(key); }, setItem: (key: string, value: string) => { if ((!failed && key === failAt) || (failed && rollbackFails)) { failed = true; throw new Error('quota'); } values.set(key, value); } };
}
it('确认写入只改选择的数据键，未选择的草稿及设置原文保持', () => {
  const target = storage(); commitRestore(data(), options, target);
  expect(JSON.parse(target.values.get(LIBRARY_STORAGE_KEY)!)).toEqual(data().library);
  expect(target.values.get(STORAGE_KEY)).toBe('old-draft'); expect(target.values.get(APPEARANCE_KEY)).toBe('old-theme');
});
it('中途写入失败时恢复所有已写键，包括原先不存在的键', () => {
  const target = storage(SORT_SETTINGS_KEY); target.values.delete(APPEARANCE_KEY);
  const old = [...target.values];
  expect(() => commitRestore(data(), { mode: 'replace', restoreDraft: true, restoreSettings: true }, target)).toThrow(/回滚/);
  expect([...target.values]).toEqual(old);
});
it('回滚失败明确报告，不能声称原数据完整保留', () => {
  const target = storage(SORT_SETTINGS_KEY, true);
  expect(() => commitRestore(data(), { mode: 'replace', restoreDraft: true, restoreSettings: true }, target)).toThrow(/回滚失败/);
});
it('组合改名后再导入仍按顺序和有效权重去重，不依赖名称或权重键顺序', () => {
  const current = data(), incoming = data();
  current.library.folders[0].chunks = [{ id: 'old', name: '手动改名', selectedTagIds: ['a', 'b'], tagWeights: { a: 0, b: 1 } }];
  incoming.library.folders[0].chunks = [{ id: 'incoming', name: '原名称', selectedTagIds: ['a', 'b'], tagWeights: { a: 0 } }];
  const next = planRestore(current, incoming, options, id);
  expect(next.library.folders[0].chunks).toEqual(current.library.folders[0].chunks);
});
it('新备份保留个人定义与停用状态，旧版备份不覆盖当前个人字典', () => {
  const value = data(); value.personal = savePersonalTag(createPersonalPreferences(), 'user:a', { zh: '私人', en: 'personal', category: 'general', aliases: [] }, []);
  value.draft.selectedTagIds.push('user:a'); value.draft.disabledTagIds = ['user:a'];
  expect(parseBackup(JSON.stringify(createBackup(value))).data).toEqual(value);
  const legacy = { ...createBackup(data()), version: 1 };
  expect(planRestore(value, parseBackup(JSON.stringify(legacy)).data, options, id).personal).toEqual(value.personal);
  expect(() => parseBackup(JSON.stringify({ ...createBackup(value), data: { ...value, personal: undefined } }))).toThrow();
});
it('个人ID冲突重映射草稿、权重、停用、收藏与组合的全部引用', () => {
  const current = data(), incoming = data();
  current.personal = savePersonalTag(createPersonalPreferences(), 'user:a', { zh: '旧', en: 'old tag', category: 'general', aliases: [] }, []);
  incoming.personal = savePersonalTag(createPersonalPreferences(), 'user:a', { zh: '新', en: 'new tag', category: 'general', aliases: [] }, []);
  incoming.draft = { ...createDraft(), selectedTagIds: ['user:a'], disabledTagIds: ['user:a'], tagWeights: { 'user:a': 0 } };
  incoming.library.folders[0].tagIds = ['user:a']; incoming.library.folders[0].chunks = [{ id: 'c', name: '组合', selectedTagIds: ['user:a'], disabledTagIds: ['user:a'], tagWeights: { 'user:a': 1.5 } }];
  const next = planRestore(current, incoming, { ...options, restoreDraft: true }, () => 'user:new');
  expect(next.personal?.tags).toHaveLength(2); expect(next.draft.selectedTagIds).toEqual(['user:new']); expect(next.draft.disabledTagIds).toEqual(['user:new']); expect(next.draft.tagWeights).toEqual({ 'user:new': 0 });
  expect(next.library.folders[0].tagIds).toEqual(['user:new']); expect(next.library.folders[0].chunks[0].disabledTagIds).toEqual(['user:new']);
});
it('停用状态不同的同名组合保留两份，恢复失败也回滚个人字典键', () => {
  const current = data(), incoming = data();
  current.library.folders[0].chunks = [{ id: 'a', name: '组合', selectedTagIds: ['smile'], tagWeights: {} }];
  incoming.library.folders[0].chunks = [{ id: 'b', name: '组合', selectedTagIds: ['smile'], tagWeights: {}, disabledTagIds: ['smile'] }];
  expect(planRestore(current, incoming, options, id).library.folders[0].chunks).toHaveLength(2);
  current.personal = createPersonalPreferences(); const target = storage(SORT_SETTINGS_KEY); target.values.set(PERSONAL_STORAGE_KEY, 'old-personal'); const before = [...target.values];
  expect(() => commitRestore(current, { ...options, restoreSettings: true }, target)).toThrow(/回滚/); expect([...target.values]).toEqual(before);
});
