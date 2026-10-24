import type { PromptDraft } from '../types';
import type { ThemeId } from '../data/themes';
import type { LibraryPreferences } from './libraryPreferences';
import type { SortSettings } from './sortPreferences';
import type { PromptChunk } from './promptChunks';
import { parseDraft, STORAGE_KEY } from './storage';
import { parseLibraryPreferences, LIBRARY_STORAGE_KEY } from './libraryPreferences';
import { parseAppearance, APPEARANCE_KEY } from './appearance';
import { SORT_SETTINGS_KEY } from './sortPreferences';
import { createPersonalPreferences, mergePersonalPreferences, parsePersonalPreferences, PERSONAL_STORAGE_KEY } from './personalTags';
import type { PersonalPreferences } from './personalTags';

export type BackupData = { draft: PromptDraft; library: LibraryPreferences; theme: ThemeId; sort: SortSettings; personal?: PersonalPreferences };
export type BackupFile = { format: 'ai-prompt-studio-backup'; version: 1 | 2; exportedAt: string; data: BackupData };
export type RestoreOptions = { mode: 'merge' | 'replace'; restoreDraft: boolean; restoreSettings: boolean; restorePersonal?: boolean };
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
type BackupStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function validateData(raw: unknown): BackupData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('备份内容格式无效。');
  const value = raw as BackupData;
  if (!value.draft || !value.library || !value.sort || typeof value.theme !== 'string') throw new Error('备份缺少草稿、收藏或设置。');
  const draft = parseDraft(JSON.stringify(value.draft));
  if (draft.error || !draft.draft) throw new Error(draft.error ?? '备份草稿损坏。');
  if (new Set(value.draft.selectedTagIds).size !== draft.draft.selectedTagIds.length) throw new Error('备份含当前版本无法识别的草稿标签，已停止恢复，避免丢失内容。');
  const library = parseLibraryPreferences(JSON.stringify(value.library));
  if (library.error || !library.preferences) throw new Error(library.error ?? '备份收藏损坏。');
  const personal = value.personal === undefined ? null : parsePersonalPreferences(JSON.stringify(value.personal));
  if (personal && (personal.error || !personal.preferences)) throw new Error(personal.error ?? '个人标签备份损坏。');
  const personalIds = new Set(personal?.preferences?.tags.map(tag => tag.id) ?? []);
  const references = [...draft.draft.selectedTagIds, ...library.preferences.folders.flatMap(folder => [...folder.tagIds, ...folder.chunks.flatMap(chunk => chunk.selectedTagIds)])];
  if (references.some(id => id.startsWith('user:') && !personalIds.has(id))) throw new Error('备份缺少被引用的个人标签定义，已停止恢复以避免丢词。');
  const appearance = parseAppearance(JSON.stringify({ version: 1, theme: value.theme }));
  if (appearance.error) throw new Error('备份主题暂不支持。');
  const sort = value.sort;
  if (!['usage', 'pinyin', 'english'].includes(sort.key) || !['asc', 'desc'].includes(sort.direction) || typeof sort.selectedFirst !== 'boolean') throw new Error('备份排序设置无效。');
  return { draft: draft.draft, library: library.preferences, theme: appearance.theme, sort: { key: sort.key, direction: sort.direction, selectedFirst: sort.selectedFirst }, ...(personal?.preferences ? { personal: personal.preferences } : {}) };
}

export function createBackup(data: BackupData): BackupFile {
  return { format: 'ai-prompt-studio-backup', version: 2, exportedAt: new Date().toISOString(), data: validateData(data) };
}
export function parseBackup(raw: string): BackupFile {
  if (new TextEncoder().encode(raw).byteLength > MAX_BACKUP_BYTES) throw new Error('备份文件超过10 MiB，请使用更小的备份。');
  let value: BackupFile;
  try { value = JSON.parse(raw.replace(/^\uFEFF/, '')); } catch { throw new Error('文件不是有效的JSON备份。'); }
  if (!value || value.format !== 'ai-prompt-studio-backup' || ![1, 2].includes(value.version)) throw new Error('备份格式或版本暂不支持。请选择本工具导出的备份。');
  if (typeof value.exportedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value.exportedAt) || Number.isNaN(Date.parse(value.exportedAt))) throw new Error('备份日期无效。');
  return { format: value.format, version: value.version, exportedAt: value.exportedAt, data: validateData(value.data) };
}

const normalized = (name: string) => name.toLocaleLowerCase();
const importedName = (name: string, n: number) => { const suffix = `（导入 ${n}）`; return [...name].slice(0, 60 - [...suffix].length).join('') + suffix; };
function sameChunk(a: PromptChunk, b: PromptChunk) {
  return a.selectedTagIds.length === b.selectedTagIds.length && a.selectedTagIds.every((id, i) => id === b.selectedTagIds[i] && (a.tagWeights[id] ?? 1) === (b.tagWeights[id] ?? 1) && Boolean(a.disabledTagIds?.includes(id)) === Boolean(b.disabledTagIds?.includes(id)));
}

function remapSelection(value: Pick<PromptDraft, 'selectedTagIds' | 'tagWeights' | 'disabledTagIds'>, mapping: Map<string, string>) {
  const selectedTagIds: string[] = [], tagWeights: Record<string, number> = {}, disabledTagIds: string[] = [], seen = new Set<string>();
  for (const source of value.selectedTagIds) {
    const id = mapping.get(source) ?? source;
    if (seen.has(id)) continue;
    seen.add(id); selectedTagIds.push(id);
    if (Object.hasOwn(value.tagWeights, source)) tagWeights[id] = value.tagWeights[source];
    if (value.disabledTagIds?.includes(source)) disabledTagIds.push(id);
  }
  return { selectedTagIds, tagWeights, ...(value.disabledTagIds !== undefined ? { disabledTagIds } : {}) };
}

export function planRestore(current: BackupData, incoming: BackupData, options: RestoreOptions, newId: () => string = () => crypto.randomUUID()): BackupData {
  const next: BackupData = structuredClone(current);
  if (incoming.personal) {
    const merged = mergePersonalPreferences(current.personal ?? createPersonalPreferences(), incoming.personal, () => { const id = newId(); return id.startsWith('user:') ? id : `user:${id}`; });
    next.personal = merged.preferences;
    incoming = structuredClone(incoming);
    incoming.draft = { ...incoming.draft, ...remapSelection(incoming.draft, merged.idMap) };
    incoming.library.folders = incoming.library.folders.map(folder => ({ ...folder, tagIds: [...new Set(folder.tagIds.map(id => merged.idMap.get(id) ?? id))], chunks: folder.chunks.map(chunk => ({ ...chunk, ...remapSelection(chunk, merged.idMap) })) }));
  }
  if (options.restoreDraft) next.draft = structuredClone(incoming.draft);
  if (options.restoreSettings) { next.theme = incoming.theme; next.sort = { ...incoming.sort }; }
  if (options.mode === 'replace') next.library.folders = structuredClone(incoming.library.folders);
  else {
    const used = new Set(next.library.folders.flatMap(folder => [folder.id, ...folder.chunks.map(chunk => chunk.id)]));
    function freshId() {
      for (let i = 0; i < 1000; i++) { const id = newId(); if (id.trim() && id !== 'all' && !used.has(id)) { used.add(id); return id; } }
      throw new Error('无法生成独立标识，请重新预览后重试。');
    }
    for (const source of incoming.library.folders) {
      let folder = next.library.folders.find(item => normalized(item.name) === normalized(source.name));
      if (!folder) { folder = { id: freshId(), name: source.name, tagIds: [], chunks: [] }; next.library.folders.push(folder); }
      folder.tagIds = [...new Set([...folder.tagIds, ...source.tagIds])];
      for (const sourceChunk of source.chunks) {
        if (folder.chunks.some(chunk => sameChunk(chunk, sourceChunk))) continue;
        let name = sourceChunk.name;
        for (let n = 2; folder.chunks.some(chunk => normalized(chunk.name) === normalized(name)); n++) name = importedName(sourceChunk.name, n);
        folder.chunks.push({ ...structuredClone(sourceChunk), id: freshId(), name });
      }
    }
  }
  next.library.usage = { ...(options.restoreSettings ? incoming.library.usage : current.library.usage) };
  return next;
}

// localStorage没有多键事务；写入前保存原文，中途失败时逆序恢复已写入的键。
export function commitRestore(data: BackupData, options: RestoreOptions, storage: BackupStorage = localStorage, operation = '恢复'): void {
  const entries: [string, string][] = [[LIBRARY_STORAGE_KEY, JSON.stringify(data.library)]];
  if (data.personal && options.restorePersonal !== false) entries.push([PERSONAL_STORAGE_KEY, JSON.stringify(data.personal)]);
  if (options.restoreDraft) entries.push([STORAGE_KEY, JSON.stringify(data.draft)]);
  if (options.restoreSettings) entries.push([APPEARANCE_KEY, JSON.stringify({ version: 1, theme: data.theme })], [SORT_SETTINGS_KEY, JSON.stringify({ version: 1, settings: data.sort })]);
  let before: Map<string, string | null>;
  try { before = new Map(entries.map(([key]) => [key, storage.getItem(key)])); } catch { throw new Error(`无法读取原数据，未开始${operation}。请允许浏览器本地存储后重试。`); }
  const changed: string[] = [];
  try {
    for (const [key, value] of entries) { storage.setItem(key, value); changed.push(key); }
  } catch {
    let rollbackFailed = false;
    for (const key of changed.reverse()) {
      try { const old = before.get(key)!; if (old === null) storage.removeItem(key); else storage.setItem(key, old); } catch { rollbackFailed = true; }
    }
    throw new Error(rollbackFailed ? `${operation}失败且部分数据回滚失败。请勿刷新，先导出当前页面备份，恢复存储权限后重试。` : `${operation}失败，已回滚本次写入，原数据保留。请检查浏览器存储权限或空间后重试。`);
  }
}
