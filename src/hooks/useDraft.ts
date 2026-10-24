import { useEffect, useState } from 'react';
import { createDraft, readDraftState, serializeDraft, STORAGE_KEY } from '../lib/storage';
import type { PromptDraft } from '../types';
import { createDraftHistory, editDraftHistory, forgetTagFromHistory, redoDraftHistory, undoDraftHistory } from '../lib/draftHistory';

export function useDraft() {
  const [initial] = useState(() => readDraftState());
  const [history, setHistory] = useState(() => createDraftHistory(initial.draft));
  const draft = history.present;
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(initial.blocked);
  const [lastSavedAt, setSavedAt] = useState<string | null>(null);
  const savedAt = lastSavedAt === draft.updatedAt ? lastSavedAt : null;

  function persist(value: PromptDraft): boolean {
    if (blocked) return false;
    try {
      localStorage.setItem(STORAGE_KEY, serializeDraft(value));
      setError(null); setSavedAt(value.updatedAt); return true;
    } catch {
      setError('保存失败：浏览器存储不可用或空间不足。内容仍在当前页面，请先复制 Prompt，并允许本地存储后重试保存。');
      setSavedAt(null); return false;
    }
  }
  useEffect(() => {
    // 每次草稿变化立即保存，不使用可能丢失最后一次输入的防抖定时器。
    if (!blocked) persist(draft);
  }, [draft, blocked]);

  function update(patch: Partial<PromptDraft>, group?: string) {
    const keys = Object.keys(patch);
    const textGroup = keys.length === 1 && ['customPositive', 'negativePrompt'].includes(keys[0]) ? keys[0] : undefined;
    setHistory(previous => editDraftHistory(previous, patch, { group: group ?? textGroup }));
  }
  function clear() {
    setHistory(previous => editDraftHistory(previous, { ...createDraft(), disabledTagIds: undefined })); setBlocked(false); setError(null);
  }
  return { draft, update, clear, error, blocked, savedAt, save: () => persist(draft),
    canUndo: history.past.length > 0, canRedo: history.future.length > 0,
    undo: () => setHistory(undoDraftHistory),
    redo: () => setHistory(redoDraftHistory),
    forgetTag: (id: string, value: PromptDraft) => setHistory(previous => forgetTagFromHistory(previous, id, value)),
    restore: (value: PromptDraft) => { setHistory(previous => editDraftHistory(previous, { ...value, disabledTagIds: value.disabledTagIds })); setBlocked(false); setError(null); },
  };
}
