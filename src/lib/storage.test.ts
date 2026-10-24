import { describe, expect, it } from 'vitest';
import { createDraft, parseDraft, readDraftState, serializeDraft } from './storage';

describe('草稿序列化兼容性', () => {
  it('读取异常时暂停写入，不能把默认草稿当成已读出的原数据', () => {
    const state = readDraftState({ getItem: () => { throw new Error('temporary read failure'); } });
    expect(state.blocked).toBe(true); expect(state.error).toBeTruthy(); expect(state.draft.selectedTagIds).toEqual([]);
  });
  it('v1 草稿往返保留原始输入、顺序及更新时间', () => {
    const draft = { ...createDraft(), selectedTagIds: ['blue-eyes', 'silver-hair'], customPositive: '  watercolor, ', negativePrompt: '', updatedAt: '2026-10-23T08:00:00.000Z' };
    expect(parseDraft(serializeDraft(draft))).toEqual({ draft, error: null });
  });
  it('首次使用返回空草稿和默认排除词', () => {
    const result = parseDraft(null);
    expect(result.error).toBeNull();
    expect(result.draft?.selectedTagIds).toEqual([]);
    expect(result.draft?.negativePrompt).toBe('blurry, low resolution');
  });
  it('重复及未知 ID 被清理且不改变有效 ID 的顺序', () => {
    const raw = JSON.stringify({ ...createDraft(), selectedTagIds: ['blue-eyes', 'obsolete', 'silver-hair', 'blue-eyes'] });
    expect(parseDraft(raw).draft?.selectedTagIds).toEqual(['blue-eyes', 'silver-hair']);
  });
  it('无效 JSON 返回可见错误而非静默覆盖', () => {
    expect(parseDraft('{bad').draft).toBeNull();
    expect(parseDraft('{bad').error).toBeTruthy();
  });
  it('未来版本不当作 v1 读取', () => {
    expect(parseDraft(JSON.stringify({ ...createDraft(), version: 2 })).error).toBeTruthy();
  });
  it('损坏字段类型被拒绝', () => {
    expect(parseDraft(JSON.stringify({ ...createDraft(), selectedTagIds: [123], customPositive: null })).error).toBeTruthy();
  });
  it('无效日期被拒绝', () => {
    expect(parseDraft(JSON.stringify({ ...createDraft(), updatedAt: 'not-a-date' })).error).toBeTruthy();
  });
  it('旧v1草稿缺少权重字段时安全添加默认值', () => {
    const legacy = { version: 1, selectedTagIds: ['silver-hair'], customPositive: '', negativePrompt: 'blurry', updatedAt: '2026-10-23T08:00:00.000Z' };
    expect(parseDraft(JSON.stringify(legacy)).draft?.tagWeights).toEqual({});
  });
  it('新快照标签ID与权重刷新后保留', () => {
    const draft = { ...createDraft(), selectedTagIds: ['db:hatsune_miku', 'silver-hair'], tagWeights: { 'db:hatsune_miku': 1.2, 'silver-hair': 0.8 } };
    expect(parseDraft(serializeDraft(draft)).draft).toEqual(draft);
  });
  it('损坏的权重字段不被静默覆盖', () => {
    expect(parseDraft(JSON.stringify({ ...createDraft(), tagWeights: { 'silver-hair': 'oops' } })).error).toBeTruthy();
  });
  it('已删除标签的权重不重新复活', () => {
    expect(parseDraft(JSON.stringify({ ...createDraft(), selectedTagIds: ['silver-hair'], tagWeights: { 'silver-hair': 1.2, 'blue-eyes': 1.5 } })).draft?.tagWeights).toEqual({ 'silver-hair': 1.2 });
  });
});
