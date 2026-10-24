import { useEffect, useState } from 'react';
import { addFavoriteChunk, addFavoriteFolder, createLibraryPreferences, deleteFavoriteChunk, deleteFavoriteFolder, LIBRARY_STORAGE_KEY, parseLibraryPreferences, renameFavoriteChunk, renameFavoriteFolder, setFolderMembership } from '../lib/libraryPreferences';
import type { LibraryPreferences, UsageThreshold } from '../lib/libraryPreferences';
import { createPromptChunk } from '../lib/promptChunks';

function load() {
  try {
    const result = parseLibraryPreferences(localStorage.getItem(LIBRARY_STORAGE_KEY));
    return { preferences: result.preferences ?? createLibraryPreferences(), error: result.error, blocked: Boolean(result.error) };
  } catch {
    return { preferences: createLibraryPreferences(), error: '无法读取浏览器收藏与筛选数据。已暂停写入，请允许本地存储后重新读取。', blocked: true };
  }
}

export function useLibraryPreferences() {
  const [initial] = useState(load);
  const [preferences, setPreferences] = useState(initial.preferences);
  const [error, setError] = useState(initial.error);
  const [blocked, setBlocked] = useState(initial.blocked);

  function persist(value: LibraryPreferences) {
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(value));
      setError(null);
    } catch {
      setError('收藏与筛选未保存：浏览器存储不可用或空间不足。修改仍在当前页面，刷新前请重试保存。');
    }
  }
  useEffect(() => { if (!blocked) persist(preferences); }, [preferences, blocked]);

  function change(action: (previous: LibraryPreferences) => LibraryPreferences) {
    if (blocked) throw new Error('收藏数据暂不可用，请先重新读取或处理数据提示。');
    // 在事件内验证名称并抛出错误供表单显示，不在 React 状态 updater 内抛错。
    setPreferences(action(preferences));
  }
  function createFolder(name: string, tagId?: string) {
    const id = crypto.randomUUID();
    change(previous => {
      const value = addFavoriteFolder(previous, id, name);
      return tagId ? setFolderMembership(value, id, tagId, true) : value;
    });
    return id;
  }
  return {
    preferences, error, blocked, createFolder,
    setUsage: (usage: UsageThreshold) => change(previous => ({ ...previous, usage })),
    renameFolder: (id: string, name: string) => change(previous => renameFavoriteFolder(previous, id, name)),
    deleteFolder: (id: string) => change(previous => deleteFavoriteFolder(previous, id)),
    setMembership: (folderId: string, tagId: string, included: boolean) => change(previous => setFolderMembership(previous, folderId, tagId, included)),
    saveChunk: (folderId: string, name: string, ids: string[], weights: Record<string, number>, disabledIds?: string[]) => {
      const chunk = createPromptChunk(crypto.randomUUID(), name, ids, weights, disabledIds);
      change(previous => addFavoriteChunk(previous, folderId, chunk));
    },
    renameChunk: (folderId: string, chunkId: string, name: string) => change(previous => renameFavoriteChunk(previous, folderId, chunkId, name)),
    deleteChunk: (folderId: string, chunkId: string) => change(previous => deleteFavoriteChunk(previous, folderId, chunkId)),
    retry: () => { if (!blocked) persist(preferences); },
    reload: () => {
      const result = load();
      setPreferences(result.preferences); setBlocked(result.blocked); setError(result.error);
    },
    reset: () => { setPreferences(createLibraryPreferences()); setBlocked(false); setError(null); },
    restore: (value: LibraryPreferences) => { setPreferences(value); setBlocked(false); setError(null); },
  };
}

export type LibraryController = ReturnType<typeof useLibraryPreferences>;
