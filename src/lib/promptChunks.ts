import type { PromptDraft } from '../types';

export type PromptChunk = { id: string; name: string; selectedTagIds: string[]; tagWeights: Record<string, number>; disabledTagIds?: string[] };

export function normalizeChunkName(name: string): string {
  const text = name.trim();
  if (!text || [...text].length > 60) throw new Error('组合名称需要 1–60 个字符。');
  return text;
}

export function parsePromptChunk(raw: unknown): PromptChunk {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('标签组合格式损坏。');
  const value = raw as Partial<PromptChunk>;
  if (typeof value.id !== 'string' || !value.id.trim() || typeof value.name !== 'string' || !Array.isArray(value.selectedTagIds) || !value.selectedTagIds.length || !value.selectedTagIds.every(id => typeof id === 'string' && id.trim() && (!id.startsWith('db:') || id.slice(3).trim()))) throw new Error('组合需要名称和至少一个有效标签。');
  if (!value.tagWeights || typeof value.tagWeights !== 'object' || Array.isArray(value.tagWeights)) throw new Error('组合权重格式损坏。');
  const weights = Object.entries(value.tagWeights);
  if (weights.some(([, weight]) => typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0 || weight > 3)) throw new Error('组合权重必须是0至3之间的数字。');
  const selectedTagIds = [...new Set(value.selectedTagIds)];
  const selected = new Set(selectedTagIds);
  if (value.disabledTagIds !== undefined && (!Array.isArray(value.disabledTagIds) || !value.disabledTagIds.every(id => typeof id === 'string'))) throw new Error('组合停用状态损坏。');
  return { id: value.id, name: normalizeChunkName(value.name), selectedTagIds, tagWeights: Object.fromEntries(weights.filter(([id, weight]) => selected.has(id) && weight !== 1)), ...(value.disabledTagIds !== undefined ? { disabledTagIds: [...new Set(value.disabledTagIds)].filter(id => selected.has(id)) } : {}) };
}

export function createPromptChunk(id: string, name: string, selectedTagIds: string[], tagWeights: Record<string, number>, disabledTagIds?: string[]): PromptChunk {
  return parsePromptChunk({ id, name, selectedTagIds, tagWeights, ...(disabledTagIds ? { disabledTagIds } : {}) });
}

export function appendPromptChunk(draft: PromptDraft, chunk: PromptChunk): Pick<PromptDraft, 'selectedTagIds' | 'tagWeights' | 'disabledTagIds'> {
  const selectedTagIds = [...new Set(draft.selectedTagIds)];
  const seen = new Set(selectedTagIds);
  const weights = new Map(Object.entries(draft.tagWeights));
  const disabled = new Set(draft.disabledTagIds ?? []);
  for (const id of chunk.selectedTagIds) {
    if (seen.has(id)) continue;
    seen.add(id); selectedTagIds.push(id);
    if (chunk.disabledTagIds?.includes(id)) disabled.add(id);
    if (Object.hasOwn(chunk.tagWeights, id)) weights.set(id, chunk.tagWeights[id]);
    else weights.delete(id);
  }
  return { selectedTagIds, tagWeights: Object.fromEntries(weights), ...(disabled.size || draft.disabledTagIds ? { disabledTagIds: [...disabled] } : {}) };
}
