import { expect, it } from 'vitest';
import { createDraft } from './storage';
import { createLibraryPreferences } from './libraryPreferences';
import { createPersonalPreferences, savePersonalTag } from './personalTags';
import { getPersonalTagDeletionImpact, planPersonalTagDeletion } from './deletePersonalTag';
import { createDraftHistory, editDraftHistory, forgetTagFromHistory, redoDraftHistory, undoDraftHistory } from './draftHistory';
import { commitRestore } from './backup';

function fixture() {
  const personal = savePersonalTag(createPersonalPreferences(), 'user:a', { zh: '私人月光', en: 'private moonlight', aliases: [], category: 'lighting' }, []);
  const draft = { ...createDraft(), selectedTagIds: ['silver-hair', 'user:a', 'smile'], tagWeights: { 'user:a': 2, smile: 0 }, disabledTagIds: ['user:a', 'smile'] };
  const library = createLibraryPreferences();
  library.folders[0].tagIds = ['user:a', 'smile'];
  library.folders[0].chunks = [
    { id: 'mixed', name: '混合组合', selectedTagIds: ['user:a', 'smile'], tagWeights: { 'user:a': 2, smile: 0 }, disabledTagIds: ['user:a', 'smile'] },
    { id: 'empty', name: '单标签组合', selectedTagIds: ['user:a'], tagWeights: { 'user:a': 1.5 } },
  ];
  return { personal, draft, library };
}

it('删除预览准确计算草稿、收藏夹、组合和删除后为空的组合', () => {
  expect(getPersonalTagDeletionImpact(fixture(), 'user:a')).toEqual({ selected: true, folders: 1, chunks: 2, emptyChunks: 1 });
});
it('真正删除定义及所有引用，保留剩余顺序、零权重、停用状态和空收藏夹', () => {
  const source = fixture(), original = structuredClone(source);
  const next = planPersonalTagDeletion(source, 'user:a');
  expect(next.personal.tags).toEqual([]);
  expect(next.draft.selectedTagIds).toEqual(['silver-hair', 'smile']);
  expect(next.draft.tagWeights).toEqual({ smile: 0 });
  expect(next.draft.disabledTagIds).toEqual(['smile']);
  expect(next.library.folders[0].tagIds).toEqual(['smile']);
  expect(next.library.folders[0].chunks).toEqual([{ id: 'mixed', name: '混合组合', selectedTagIds: ['smile'], tagWeights: { smile: 0 }, disabledTagIds: ['smile'] }]);
  expect(source).toEqual(original);
});
it('不存在的个人标签与内置标签均不能通过删除入口移除', () => {
  expect(() => planPersonalTagDeletion(fixture(), 'user:missing')).toThrow();
  expect(() => planPersonalTagDeletion(fixture(), 'silver-hair')).toThrow();
});
it('清理撤销重做中的定义引用，其他编辑仍然可以撤销重做且不产生空白步骤', () => {
  const source = fixture();
  let history = createDraftHistory({ ...source.draft, selectedTagIds: ['smile'], tagWeights: { smile: 0 }, disabledTagIds: ['smile'] });
  history = editDraftHistory(history, source.draft);
  history = editDraftHistory(history, { customPositive: 'moonlight' });
  history = undoDraftHistory(history);
  const next = planPersonalTagDeletion({ ...source, draft: history.present }, 'user:a');
  history = forgetTagFromHistory(history, 'user:a', next.draft);
  expect(history.past).toHaveLength(1); // 银发的新增仍然可撤销
  history = redoDraftHistory(history);
  expect(history.present.customPositive).toBe('moonlight');
  expect(undoDraftHistory(history).present.customPositive).toBe('');
  for (const item of [...history.past, history.present, ...history.future]) {
    expect(item.selectedTagIds).not.toContain('user:a');
    expect(Object.hasOwn(item.tagWeights, 'user:a')).toBe(false);
    expect(item.disabledTagIds).not.toContain('user:a');
  }
});
it('删除是唯一差别时清理重复历史，不让撤销复活被删除的词条', () => {
  const source = fixture();
  let history = createDraftHistory(source.draft);
  history = editDraftHistory(history, { selectedTagIds: ['silver-hair', 'smile'], tagWeights: { smile: 0 }, disabledTagIds: ['smile'] });
  history = forgetTagFromHistory(history, 'user:a', planPersonalTagDeletion({ ...source, draft: history.present }, 'user:a').draft);
  expect(history.past).toEqual([]);
  expect(undoDraftHistory(history)).toBe(history);
});
it('写入中途失败回滚全部已写入数据，原定义、收藏和草稿不被半删除', () => {
  const data = { ...planPersonalTagDeletion(fixture(), 'user:a'), theme: 'sky' as const, sort: { key: 'usage' as const, direction: 'desc' as const, selectedFirst: false } };
  const values = new Map([['ai-prompt-studio:library', 'original-library'], ['ai-prompt-studio:personal-tags', 'original-personal'], ['ai-prompt-studio:draft', 'original-draft']]);
  const before = new Map(values);
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (key.endsWith(':draft') && value !== 'original-draft') throw new Error('quota'); values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  expect(() => commitRestore(data, { mode: 'replace', restorePersonal: true, restoreDraft: true, restoreSettings: false }, storage, '删除标签')).toThrow(/删除标签失败/);
  expect(values).toEqual(before);
});
