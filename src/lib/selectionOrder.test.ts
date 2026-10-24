import { expect, it } from 'vitest';
import { buildPrompt, moveSelectedTag } from './prompt';
import { createDraft, parseDraft, serializeDraft } from './storage';
import { appendPromptChunk, createPromptChunk } from './promptChunks';
import { sampleTags } from '../data/sampleTags';

it.each([
  ['silver-hair', 'smile', ['blue-eyes', 'smile', 'silver-hair']],
  ['smile', 'silver-hair', ['smile', 'silver-hair', 'blue-eyes']],
  ['silver-hair', 'blue-eyes', ['blue-eyes', 'silver-hair', 'smile']],
  ['blue-eyes', 'smile', ['silver-hair', 'smile', 'blue-eyes']],
])('将 %s 拖至 %s 的位置时移动整个标签，保留其他相对顺序', (active, over, expected) => {
  const ids = ['silver-hair', 'blue-eyes', 'smile'];
  expect(moveSelectedTag(ids, active, over)).toEqual(expected);
  expect(ids).toEqual(['silver-hair', 'blue-eyes', 'smile']);
});
it.each([['silver-hair', 'silver-hair'], ['missing', 'blue-eyes'], ['silver-hair', 'missing'], ['silver-hair', null]])('原位、未知或取消目标保持原选择和引用：%s → %s', (active, over) => {
  const ids = ['silver-hair', 'blue-eyes']; expect(moveSelectedTag(ids, active, over)).toBe(ids);
});
it('空列表和单标签拖动不新增或丢失标签', () => {
  const empty: string[] = []; const single = ['silver-hair'];
  expect(moveSelectedTag(empty, 'a', 'b')).toBe(empty); expect(moveSelectedTag(single, 'silver-hair', 'silver-hair')).toBe(single);
});
it('拖拽后Prompt采用新顺序，零权重、默认权重、自定义内容保持', () => {
  const ids = moveSelectedTag(['silver-hair', 'blue-eyes', 'smile'], 'smile', 'silver-hair');
  const weights = { 'silver-hair': 1.5, 'blue-eyes': 0 };
  expect(buildPrompt(ids, 'moonlight', sampleTags, weights)).toBe('smile, 1.5::silver hair ::, 0::blue eyes ::, moonlight');
  expect(weights).toEqual({ 'silver-hair': 1.5, 'blue-eyes': 0 });
});
it('新顺序可随草稿刷新恢复，并以该顺序收藏和追加组合', () => {
  const draft = { ...createDraft(), selectedTagIds: moveSelectedTag(['silver-hair', 'blue-eyes', 'smile'], 'smile', 'silver-hair'), tagWeights: { 'silver-hair': 1.2 }, customPositive: 'clouds' };
  const restored = parseDraft(serializeDraft(draft)).draft!;
  expect(restored.selectedTagIds).toEqual(['smile', 'silver-hair', 'blue-eyes']); expect(restored.customPositive).toBe('clouds');
  const chunk = createPromptChunk('ordered', '已排序组合', restored.selectedTagIds, restored.tagWeights);
  expect(appendPromptChunk(createDraft(), chunk)).toEqual({ selectedTagIds: ['smile', 'silver-hair', 'blue-eyes'], tagWeights: { 'silver-hair': 1.2 } });
});
