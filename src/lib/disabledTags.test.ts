import { expect, it } from 'vitest';
import { buildPrompt } from './prompt';
import { createDraft, parseDraft } from './storage';
import { createDraftHistory, editDraftHistory, undoDraftHistory, redoDraftHistory } from './draftHistory';
import { appendPromptChunk, createPromptChunk, parsePromptChunk } from './promptChunks';
const tags = [{ id: 'silver-hair', en: 'silver hair', zh: '银发', category: 'hair' as const }, { id: 'smile', en: 'smile', zh: '微笑', category: 'expression' as const }];
it('停用不输出但不删除顺序和权重，0权重不等同于停用', () => {
  const ids = tags.map(t => t.id), weights = { 'silver-hair': 0, smile: 1.5 };
  expect(buildPrompt(ids, 'custom', tags, weights, ['smile'])).toBe('0::silver hair ::, custom');
  expect(ids).toEqual(['silver-hair', 'smile']); expect(weights.smile).toBe(1.5);
});
it('草稿停用状态往返，旧草稿兼容，未知ID从停用集合移除，损坏类型拒绝', () => {
  const draft = { ...createDraft(), selectedTagIds: ['user:a', 'smile'], disabledTagIds: ['user:a', 'missing'] };
  expect(parseDraft(JSON.stringify(draft)).draft?.disabledTagIds).toEqual(['user:a']);
  expect(parseDraft(JSON.stringify({ ...draft, disabledTagIds: 'bad' })).error).toBeTruthy();
  expect(parseDraft(JSON.stringify(createDraft())).error).toBeNull();
});
it('启停独立记录可撤销重做，历史快照不共享停用数组', () => {
  const original = { ...createDraft(), selectedTagIds: ['smile'], disabledTagIds: [] as string[] };
  const next = editDraftHistory(createDraftHistory(original), { disabledTagIds: ['smile'] });
  expect(undoDraftHistory(next).present.disabledTagIds).toEqual([]); expect(redoDraftHistory(undoDraftHistory(next)).present.disabledTagIds).toEqual(['smile']);
  original.disabledTagIds.push('smile'); expect(next.past[0].disabledTagIds).toEqual([]);
});
it('组合保存停用状态，新标签恢复组合状态，重复标签保留当前启停与权重', () => {
  const chunk = createPromptChunk('c', '组合', ['smile', 'silver-hair'], { smile: 2 }, ['smile', 'silver-hair']);
  expect(parsePromptChunk(JSON.parse(JSON.stringify(chunk))).disabledTagIds).toEqual(['smile', 'silver-hair']);
  const next = appendPromptChunk({ ...createDraft(), selectedTagIds: ['smile'], tagWeights: { smile: 0 } }, chunk);
  expect(next.disabledTagIds).toEqual(['silver-hair']); expect(next.tagWeights.smile).toBe(0);
});
