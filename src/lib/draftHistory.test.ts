import { expect, it } from 'vitest';
import { createDraft } from './storage';
import { createDraftHistory, editDraftHistory, undoDraftHistory, redoDraftHistory } from './draftHistory';

const draft = () => ({ ...createDraft(), selectedTagIds: ['silver-hair', 'smile'], tagWeights: { 'silver-hair': 1.5, smile: 0 } });
it('删除、拖动与清空可完整撤销重做，保留权重0和顺序', () => {
  const first = createDraftHistory(draft());
  const moved = editDraftHistory(first, { selectedTagIds: ['smile', 'silver-hair'] }, { now: 1000 });
  const cleared = editDraftHistory(moved, createDraft(), { now: 1100 });
  expect(undoDraftHistory(cleared).present.selectedTagIds).toEqual(['smile', 'silver-hair']);
  expect(undoDraftHistory(undoDraftHistory(cleared)).present.tagWeights).toEqual(first.present.tagWeights);
  expect(redoDraftHistory(undoDraftHistory(cleared)).present.selectedTagIds).toEqual([]);
});
it('连续调同一权重在800毫秒内合并，不同标签与超时分别记录', () => {
  let h = createDraftHistory(draft());
  h = editDraftHistory(h, { tagWeights: { smile: 0, 'silver-hair': 1.6 } }, { group: 'weight:silver-hair', now: 1000 });
  h = editDraftHistory(h, { tagWeights: { smile: 0, 'silver-hair': 1.7 } }, { group: 'weight:silver-hair', now: 1300 });
  expect(h.past).toHaveLength(1); expect(undoDraftHistory(h).present.tagWeights['silver-hair']).toBe(1.5);
  h = editDraftHistory(h, { tagWeights: { smile: .5 } }, { group: 'weight:smile', now: 1400 });
  h = editDraftHistory(h, { tagWeights: { smile: .6 } }, { group: 'weight:smile', now: 2300 });
  expect(h.past).toHaveLength(3);
});
it('连续文本输入合并，撤销后新编辑清空重做分支', () => {
  let h = createDraftHistory(draft());
  h = editDraftHistory(h, { customPositive: 'm' }, { group: 'customPositive', now: 1000 });
  h = editDraftHistory(h, { customPositive: 'moon' }, { group: 'customPositive', now: 1200 });
  h = undoDraftHistory(h);
  expect(h.present.customPositive).toBe('');
  h = editDraftHistory(h, { negativePrompt: 'text' }, { now: 1400 });
  expect(h.future).toHaveLength(0); expect(redoDraftHistory(h)).toBe(h);
});
it('无效移动和相同数值不产生历史，空历史撤销重做无副作用', () => {
  const h = createDraftHistory(draft());
  expect(editDraftHistory(h, { selectedTagIds: [...h.present.selectedTagIds], tagWeights: { ...h.present.tagWeights } })).toBe(h);
  expect(undoDraftHistory(h)).toBe(h); expect(redoDraftHistory(h)).toBe(h);
});
it('最多10步，不保留整个词库，传入快照不被改动', () => {
  const original = draft(); let h = createDraftHistory(original);
  for (let i = 1; i <= 12; i++) h = editDraftHistory(h, { customPositive: String(i) }, { now: i * 1000 });
  expect(h.past).toHaveLength(10); expect(h.past[0].customPositive).toBe('2');
  expect(original.customPositive).toBe(''); expect(Object.keys(h.present).sort()).toEqual(Object.keys(original).sort());
});
it('恢复草稿是独立一步，撤销后能恢复自定义文本及排除词', () => {
  let h = createDraftHistory({ ...draft(), customPositive: 'original', negativePrompt: 'text' });
  h = editDraftHistory(h, { ...createDraft(), customPositive: 'imported' });
  expect(undoDraftHistory(h).present.customPositive).toBe('original');
  expect(undoDraftHistory(h).present.negativePrompt).toBe('text');
});
