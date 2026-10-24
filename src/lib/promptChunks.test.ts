import { expect, it } from 'vitest';
import { appendPromptChunk, createPromptChunk, parsePromptChunk } from './promptChunks';
import { addFavoriteChunk, addFavoriteFolder, createLibraryPreferences, deleteFavoriteChunk, deleteFavoriteFolder, getFavoriteTagIds, parseLibraryPreferences, renameFavoriteChunk, renameFavoriteFolder } from './libraryPreferences';
import { createDraft } from './storage';

const make = () => createPromptChunk('chunk-a', '  银发角色  ', ['hair-silver', 'eyes-blue', 'hair-silver', 'db:future_tag'], { 'hair-silver': 1.5, 'eyes-blue': 0, 'db:future_tag': 1, unused: 2 });

it('收藏组合保存有序去重标签和权重副本，忽略未选标签权重', () => {
  const chunk = make();
  expect(chunk).toEqual({ id: 'chunk-a', name: '银发角色', selectedTagIds: ['hair-silver', 'eyes-blue', 'db:future_tag'], tagWeights: { 'hair-silver': 1.5, 'eyes-blue': 0 } });
});
it('保存后的组合不随来源选择或权重改变', () => {
  const ids = ['hair-silver']; const weights = { 'hair-silver': 1.2 };
  const chunk = createPromptChunk('c', '组合', ids, weights);
  ids.push('eyes-blue'); weights['hair-silver'] = 3;
  expect(chunk.selectedTagIds).toEqual(['hair-silver']); expect(chunk.tagWeights['hair-silver']).toBe(1.2);
});
it('追加保留原位置、隐式1和显式0权重，只为新标签采用组合权重', () => {
  const draft = { ...createDraft(), selectedTagIds: ['eyes-blue', 'hair-silver'], tagWeights: { 'eyes-blue': 0 }, customPositive: 'moonlight', negativePrompt: 'blurry' };
  const chunk = createPromptChunk('c', '组合', ['hair-silver', 'eyes-blue', 'db:smile'], { 'hair-silver': 2, 'eyes-blue': 2.5, 'db:smile': 1.3 });
  const result = appendPromptChunk(draft, chunk);
  expect(result).toEqual({ selectedTagIds: ['eyes-blue', 'hair-silver', 'db:smile'], tagWeights: { 'eyes-blue': 0, 'db:smile': 1.3 } });
  expect(draft.customPositive).toBe('moonlight'); expect(draft.negativePrompt).toBe('blurry');
  expect(draft.selectedTagIds).toEqual(['eyes-blue', 'hair-silver']); expect(chunk.tagWeights['hair-silver']).toBe(2);
});
it('多次调用组合不会重复增加，已存在标签权重持续保留', () => {
  const chunk = make(); const once = { ...createDraft(), ...appendPromptChunk(createDraft(), chunk) };
  expect(appendPromptChunk(once, chunk)).toEqual({ selectedTagIds: ['hair-silver', 'eyes-blue', 'db:future_tag'], tagWeights: { 'hair-silver': 1.5, 'eyes-blue': 0 } });
});
it.each(['', ' ', '字'.repeat(61)])('组合名称不允许空白或超过60字符：%s', name => expect(() => createPromptChunk('c', name, ['hair-silver'], {})).toThrow());
it.each([-0.01, 3.01, Infinity, NaN, '1.2'])('拒绝非法权重，避免损坏数据被保存：%s', weight => {
  expect(() => parsePromptChunk({ id: 'c', name: '组合', selectedTagIds: ['hair-silver'], tagWeights: { 'hair-silver': weight } })).toThrow();
});
it('空组合、空ID、损坏数组及权重对象不能作为可恢复的组合', () => {
  for (const overrides of [{ selectedTagIds: [] }, { id: '' }, { selectedTagIds: [123] }, { selectedTagIds: [' '] }, { tagWeights: [] }, { tagWeights: null }]) {
    expect(() => parsePromptChunk({ id: 'c', name: '组合', selectedTagIds: ['hair-silver'], tagWeights: {}, ...overrides })).toThrow();
  }
});
it('数据库标签ID必须含实际标签名，空名称不能加入组合后在刷新时丢失', () => {
  for (const id of ['db:', 'db:   ']) expect(() => createPromptChunk('c', '组合', [id], {})).toThrow();
});
it('组合可在收藏夹内增删改名，保存不自动给内部标签加星标', () => {
  const initial = createLibraryPreferences(); const value = addFavoriteChunk(initial, 'default', make());
  expect(initial.folders[0].chunks).toEqual([]); expect(value.folders[0].chunks[0].name).toBe('银发角色');
  expect([...getFavoriteTagIds(value.folders, 'all')]).toEqual([]);
  const renamed = renameFavoriteChunk(value, 'default', 'chunk-a', '  新名字  ');
  expect(renamed.folders[0].chunks[0].name).toBe('新名字'); expect(value.folders[0].chunks[0].name).toBe('银发角色');
  expect(deleteFavoriteChunk(renamed, 'default', 'chunk-a').folders[0].chunks).toEqual([]);
});
it('同一文件夹组合不重名，不同文件夹可同名，组合ID全局唯一', () => {
  let value = addFavoriteFolder(createLibraryPreferences(), 'b', '另一个收藏夹'); value = addFavoriteChunk(value, 'default', make());
  const sameName = { ...make(), id: 'chunk-b' };
  expect(() => addFavoriteChunk(value, 'default', sameName)).toThrow();
  const other = addFavoriteChunk(value, 'b', sameName); expect(other.folders[1].chunks).toHaveLength(1);
  expect(() => addFavoriteChunk(value, 'b', make())).toThrow();
  const third = addFavoriteChunk(value, 'default', { ...make(), id: 'third', name: '另一个组合' });
  expect(() => renameFavoriteChunk(third, 'default', 'third', '银发角色')).toThrow();
});
it('重命名收藏夹保留组合，删除收藏夹仅移除其内部组合', () => {
  let value = addFavoriteChunk(createLibraryPreferences(), 'default', make()); value = addFavoriteFolder(value, 'b', '其他');
  const renamed = renameFavoriteFolder(value, 'default', '改名'); expect(renamed.folders[0].chunks).toEqual(value.folders[0].chunks);
  const deleted = deleteFavoriteFolder(renamed, 'default'); expect(deleted.folders).toEqual([{ id: 'b', name: '其他', tagIds: [], chunks: [] }]);
});
it('不存在的收藏夹或组合不会被误写入其他文件夹', () => {
  const value = createLibraryPreferences();
  expect(() => addFavoriteChunk(value, 'missing', make())).toThrow();
  expect(() => renameFavoriteChunk(value, 'default', 'missing', '新名')).toThrow();
});
it('存储中重复组合ID或同文件夹重复组合名会阻止整个数据读取', () => {
  for (const chunks of [[make(), make()], [make(), { ...make(), id: 'b' }]]) {
    const value = createLibraryPreferences(); value.folders[0].chunks = chunks;
    const result = parseLibraryPreferences(JSON.stringify(value)); expect(result.preferences).toBeNull(); expect(result.error).toBeTruthy();
  }
});
