import { normalizeChunkName, parsePromptChunk } from './promptChunks';
import type { PromptChunk } from './promptChunks';

export type UsageThreshold = { enabled: boolean; minimum: number };
export type FavoriteFolder = { id: string; name: string; tagIds: string[]; chunks: PromptChunk[] };
export type LibraryPreferences = { version: 2; usage: UsageThreshold; folders: FavoriteFolder[] };
export const LIBRARY_STORAGE_KEY = 'ai-prompt-studio:library';

export function createLibraryPreferences(): LibraryPreferences {
  return { version: 2, usage: { enabled: false, minimum: 1000 }, folders: [{ id: 'default', name: '默认收藏', tagIds: [], chunks: [] }] };
}

export function parseUsageThreshold(raw: string): number | null {
  const text = raw.trim();
  const value = Number(text);
  return /^\d+$/.test(text) && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function matchesUsageThreshold(tag: { id?: string; postCount?: number }, usage: UsageThreshold): boolean {
  return Boolean(tag.id?.startsWith('user:')) || !usage.enabled || (typeof tag.postCount === 'number' && Number.isFinite(tag.postCount) && tag.postCount >= usage.minimum);
}

function folderName(name: string, folders: FavoriteFolder[], exceptId?: string): string {
  const trimmed = name.trim();
  if (!trimmed || [...trimmed].length > 40) throw new Error('收藏夹名称需要 1–40 个字符。');
  if (folders.some(folder => folder.id !== exceptId && folder.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) throw new Error('已有同名收藏夹，请换一个名称。');
  return trimmed;
}

export function parseLibraryPreferences(raw: string | null): { preferences: LibraryPreferences | null; error: string | null } {
  if (raw === null) return { preferences: createLibraryPreferences(), error: null };
  try {
    const value = JSON.parse(raw) as (Partial<Omit<LibraryPreferences, 'version'>> & { version?: number }) | null;
    if (!value || (value.version !== 1 && value.version !== 2)) throw new Error('收藏与筛选数据版本无效或暂不支持。');
    if (!value.usage || typeof value.usage.enabled !== 'boolean' || !Number.isSafeInteger(value.usage.minimum) || value.usage.minimum < 0 || !Array.isArray(value.folders)) throw new Error('收藏与筛选数据格式损坏。');
    const folders: FavoriteFolder[] = [];
    const chunkIds = new Set<string>();
    for (const item of value.folders) {
      if (!item || typeof item.id !== 'string' || !item.id.trim() || item.id === 'all' || folders.some(folder => folder.id === item.id) || typeof item.name !== 'string' || !Array.isArray(item.tagIds) || !item.tagIds.every(id => typeof id === 'string' && id.length > 0)) throw new Error('收藏夹字段损坏。');
      if (value.version === 2 && !Array.isArray(item.chunks)) throw new Error('收藏夹组合列表损坏。');
      const chunks: PromptChunk[] = [];
      for (const rawChunk of value.version === 2 ? item.chunks : []) {
        const chunk = parsePromptChunk(rawChunk);
        if (chunkIds.has(chunk.id) || chunks.some(other => other.name.toLocaleLowerCase() === chunk.name.toLocaleLowerCase())) throw new Error('收藏组合标识或名称重复。');
        chunkIds.add(chunk.id); chunks.push(chunk);
      }
      folders.push({ id: item.id, name: folderName(item.name, folders), tagIds: [...new Set(item.tagIds)], chunks });
    }
    return { preferences: { version: 2, usage: { ...value.usage }, folders }, error: null };
  } catch (cause) {
    return { preferences: null, error: cause instanceof SyntaxError ? '收藏与筛选数据不是有效的 JSON。' : cause instanceof Error ? cause.message : '无法读取收藏与筛选数据。' };
  }
}

export function addFavoriteFolder(value: LibraryPreferences, id: string, name: string): LibraryPreferences {
  if (!id.trim() || id === 'all' || value.folders.some(folder => folder.id === id)) throw new Error('收藏夹标识重复或无效。');
  return { ...value, folders: [...value.folders, { id, name: folderName(name, value.folders), tagIds: [], chunks: [] }] };
}

export function renameFavoriteFolder(value: LibraryPreferences, id: string, name: string): LibraryPreferences {
  const normalized = folderName(name, value.folders, id);
  return { ...value, folders: value.folders.map(folder => folder.id === id ? { ...folder, name: normalized } : folder) };
}

export function deleteFavoriteFolder(value: LibraryPreferences, id: string): LibraryPreferences {
  return { ...value, folders: value.folders.filter(folder => folder.id !== id) };
}

export function setFolderMembership(value: LibraryPreferences, folderId: string, tagId: string, included: boolean): LibraryPreferences {
  return { ...value, folders: value.folders.map(folder => folder.id !== folderId ? folder : {
    ...folder, tagIds: included ? [...new Set([...folder.tagIds, tagId])] : folder.tagIds.filter(id => id !== tagId),
  }) };
}

export function getFavoriteTagIds(folders: FavoriteFolder[], folderId: string): Set<string> {
  return new Set(folders.filter(folder => folderId === 'all' || folder.id === folderId).flatMap(folder => folder.tagIds));
}

export function resolveFavoriteFolderId(folders: FavoriteFolder[], folderId: string): string {
  return folderId === 'all' || folders.some(folder => folder.id === folderId) ? folderId : 'all';
}

function getFolder(value: LibraryPreferences, id: string): FavoriteFolder {
  const folder = value.folders.find(item => item.id === id);
  if (!folder) throw new Error('收藏夹已不存在，请重新选择。');
  return folder;
}

export function addFavoriteChunk(value: LibraryPreferences, folderId: string, input: PromptChunk): LibraryPreferences {
  const folder = getFolder(value, folderId);
  const chunk = parsePromptChunk(input);
  if (value.folders.some(item => item.chunks.some(other => other.id === chunk.id))) throw new Error('组合标识重复。');
  if (folder.chunks.some(other => other.name.toLocaleLowerCase() === chunk.name.toLocaleLowerCase())) throw new Error('这个收藏夹中已有同名组合，请换一个名称。');
  return { ...value, folders: value.folders.map(item => item.id === folderId ? { ...item, chunks: [...item.chunks, chunk] } : item) };
}

export function renameFavoriteChunk(value: LibraryPreferences, folderId: string, chunkId: string, name: string): LibraryPreferences {
  const folder = getFolder(value, folderId); const normalized = normalizeChunkName(name);
  if (!folder.chunks.some(chunk => chunk.id === chunkId)) throw new Error('标签组合已不存在。');
  if (folder.chunks.some(chunk => chunk.id !== chunkId && chunk.name.toLocaleLowerCase() === normalized.toLocaleLowerCase())) throw new Error('这个收藏夹中已有同名组合，请换一个名称。');
  return { ...value, folders: value.folders.map(item => item.id === folderId ? { ...item, chunks: item.chunks.map(chunk => chunk.id === chunkId ? { ...chunk, name: normalized } : chunk) } : item) };
}

export function deleteFavoriteChunk(value: LibraryPreferences, folderId: string, chunkId: string): LibraryPreferences {
  getFolder(value, folderId);
  return { ...value, folders: value.folders.map(item => item.id === folderId ? { ...item, chunks: item.chunks.filter(chunk => chunk.id !== chunkId) } : item) };
}
