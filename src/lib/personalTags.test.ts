import { expect, it } from 'vitest';
import { applyPersonalTags, archivePersonalTag, createPersonalPreferences, getPersonalEditingInput, mergePersonalPreferences, parsePersonalPreferences, resetPersonalOverride, savePersonalTag, setPersonalOverride } from './personalTags';
import { matchesUsageThreshold } from './libraryPreferences';
import { matchesTag } from './prompt';
import type { Tag } from '../types';
const base: Tag[] = [{ id: 'silver-hair', en: 'silver hair', zh: '银发', category: 'hair', aliases: ['银色头发'], postCount: 100 }];
const input = { en: 'personal moonlight', zh: '私人月光', category: 'lighting' as const, aliases: ['我的月光'] };
it('个人字典独立保存，合法往返，损坏与未来版本不静默覆盖', () => {
  const value = savePersonalTag(createPersonalPreferences(), 'user:a', input, base);
  expect(parsePersonalPreferences(JSON.stringify(value)).preferences).toEqual(value);
  expect(parsePersonalPreferences('{bad').error).toBeTruthy(); expect(parsePersonalPreferences('{"version":99}').preferences).toBeNull();
});
it('新增和编辑沿用ID，可按中文英文别名搜索，不修改基础数组', () => {
  let value = savePersonalTag(createPersonalPreferences(), 'user:a', input, base);
  value = savePersonalTag(value, 'user:a', { ...input, zh: '我的光照' }, base);
  const result = applyPersonalTags(base, value);
  expect(result.tags[1].id).toBe('user:a'); expect(['我的光照', 'personal moonlight', '我的月光'].every(q => matchesTag(result.tags[1], q))).toBe(true);
  expect(base).toHaveLength(1); expect(value.tags).toHaveLength(1);
});
it('拒绝重复英文、空名称、无效分类与Prompt控制符', () => {
  for (const changed of [{ en: 'SILVER_HAIR' }, { zh: ' ' }, { en: 'a,b' }, { en: '1.2::moon::' }, { category: 'invalid' }]) {
    expect(() => savePersonalTag(createPersonalPreferences(), 'user:a', { ...input, ...changed } as typeof input, base)).toThrow();
  }
});
it('内置词条个人修正支持恢复原文，原中文仍能搜索，英文及统计保持', () => {
  const value = setPersonalOverride(createPersonalPreferences(), base[0], { zh: '我的银发', aliases: ['银亮'], category: 'style' });
  const changed = applyPersonalTags(base, value).tags[0];
  expect(changed.zh).toBe('我的银发'); expect(changed.category).toBe('style'); expect(changed.en).toBe(base[0].en); expect(changed.postCount).toBe(100);
  expect(matchesTag(changed, '银色头发')).toBe(true);
  expect(applyPersonalTags(base, resetPersonalOverride(value, base[0].id)).tags).toEqual(base);
});
it('归档隐藏库中词条但保留定义，恢复后ID和顺序不变', () => {
  const value = savePersonalTag(createPersonalPreferences(), 'user:a', input, base);
  const archived = archivePersonalTag(value, 'user:a', true);
  expect(applyPersonalTags(base, archived).tags).toHaveLength(1); expect(archived.tags[0].id).toBe('user:a');
  expect(applyPersonalTags(base, archivePersonalTag(archived, 'user:a', false)).tags[1].id).toBe('user:a');
});
it('个人标签不因没有Danbooru引用而被门槛隐藏，基础词条仍遵守门槛', () => {
  expect(matchesUsageThreshold({ id: 'user:a' }, { enabled: true, minimum: 10000 })).toBe(true);
  expect(matchesUsageThreshold({ id: 'silver-hair' }, { enabled: true, minimum: 10000 })).toBe(false);
});
it('编辑保存旧归档标签时恢复可用状态，沿用原ID', () => {
  const value = archivePersonalTag(savePersonalTag(createPersonalPreferences(), 'user:a', input, base), 'user:a', true);
  const saved = savePersonalTag(value, 'user:a', { ...input, zh: '更新后的月光' }, base);
  expect(saved.tags[0].archived).toBeUndefined();
  expect(applyPersonalTags(base, saved).tags[1].id).toBe('user:a');
});
it('个人合并按英文去重，同ID不同内容重映射，现有修正保持', () => {
  const current = savePersonalTag(createPersonalPreferences(), 'user:a', input, base);
  let incoming = savePersonalTag(createPersonalPreferences(), 'user:a', { ...input, en: 'other light' }, base);
  incoming = savePersonalTag(incoming, 'user:b', input, base);
  const result = mergePersonalPreferences(current, incoming, () => 'user:new');
  expect(result.preferences.tags).toHaveLength(2); expect(result.idMap.get('user:a')).toBe('user:new'); expect(result.idMap.get('user:b')).toBe('user:a');
});
it('再次编辑只读取30个个人别名，原词库别名不占编辑额度', () => {
  const aliases = Array.from({ length: 30 }, (_, i) => `别名${i}`);
  const value = setPersonalOverride(createPersonalPreferences(), base[0], { zh: '新译名', aliases, category: 'hair' });
  const displayed = applyPersonalTags(base, value).tags[0]; expect(displayed.aliases!.length).toBeGreaterThan(30);
  const input = getPersonalEditingInput(displayed, value); expect(input.aliases).toHaveLength(30);
  expect(() => setPersonalOverride(value, base[0], input)).not.toThrow();
});
