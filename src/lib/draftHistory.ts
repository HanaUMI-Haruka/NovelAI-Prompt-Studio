import type { PromptDraft } from '../types';
import { removeTagFromSelection } from './deletePersonalTag';

export type DraftHistory = { past: PromptDraft[]; present: PromptDraft; future: PromptDraft[]; group: { key: string; time: number } | null };
type EditOptions = { group?: string; now?: number };
export const HISTORY_LIMIT = 10;
const snapshot = (value: PromptDraft): PromptDraft => ({ ...value, selectedTagIds: [...value.selectedTagIds], tagWeights: { ...value.tagWeights }, ...(value.disabledTagIds ? { disabledTagIds: [...value.disabledTagIds] } : {}) });
const sameContent = (a: PromptDraft, b: PromptDraft) => a.customPositive === b.customPositive && a.negativePrompt === b.negativePrompt && a.selectedTagIds.length === b.selectedTagIds.length && a.selectedTagIds.every((id, i) => id === b.selectedTagIds[i]) && Object.keys(a.tagWeights).length === Object.keys(b.tagWeights).length && Object.entries(a.tagWeights).every(([id, weight]) => b.tagWeights[id] === weight) && (a.disabledTagIds ?? []).length === (b.disabledTagIds ?? []).length && (a.disabledTagIds ?? []).every((id, i) => id === b.disabledTagIds?.[i]);
export const createDraftHistory = (draft: PromptDraft): DraftHistory => ({ past: [], present: snapshot(draft), future: [], group: null });

// 字典删除不参与草稿撤销；清理全部快照中的引用，同时保留其他编辑的历史。
export function forgetTagFromHistory(history: DraftHistory, id: string, present: PromptDraft): DraftHistory {
  function compact(values: PromptDraft[]): PromptDraft[] {
    const result: PromptDraft[] = []; let previous = present;
    for (const value of values) {
      const cleaned = removeTagFromSelection(value, id);
      if (!sameContent(previous, cleaned)) { result.push(cleaned); previous = cleaned; }
    }
    return result;
  }
  return { past: compact([...history.past].reverse()).reverse(), present, future: compact(history.future), group: null };
}

export function editDraftHistory(history: DraftHistory, patch: Partial<PromptDraft>, options: EditOptions = {}): DraftHistory {
  const now = options.now ?? Date.now();
  const next = snapshot({ ...history.present, ...patch, version: 1, updatedAt: new Date(now).toISOString() });
  if (sameContent(history.present, next)) return history;
  const grouped = Boolean(options.group && history.group?.key === options.group && now >= history.group.time && now - history.group.time <= 800 && !history.future.length);
  return { past: grouped ? history.past : [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [], group: options.group ? { key: options.group, time: now } : null };
}

export function undoDraftHistory(history: DraftHistory): DraftHistory {
  if (!history.past.length) return history;
  return { past: history.past.slice(0, -1), present: { ...snapshot(history.past.at(-1)!), updatedAt: new Date().toISOString() }, future: [history.present, ...history.future].slice(0, HISTORY_LIMIT), group: null };
}
export function redoDraftHistory(history: DraftHistory): DraftHistory {
  if (!history.future.length) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: { ...snapshot(history.future[0]), updatedAt: new Date().toISOString() }, future: history.future.slice(1), group: null };
}
