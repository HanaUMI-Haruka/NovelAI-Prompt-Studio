import type { SortDirection, TagSortKey } from './tagSorting';

export type SortSettings = { key: TagSortKey; direction: SortDirection; selectedFirst: boolean };
export const SORT_SETTINGS_KEY = 'ai-prompt-studio:sort';
const SETTINGS_KEY = SORT_SETTINGS_KEY;
const defaults = (): SortSettings => ({ key: 'usage', direction: 'desc', selectedFirst: false });
const validKey = (key: unknown): key is TagSortKey => key === 'usage' || key === 'pinyin' || key === 'english';
const validDirection = (value: unknown): value is SortDirection => value === 'asc' || value === 'desc';

export function parseSortSettings(raw: string | null): { settings: SortSettings; error: string | null } {
  if (raw === null) return { settings: defaults(), error: null };
  try {
    const value = JSON.parse(raw) as { version?: number; settings?: { key?: unknown; direction?: unknown; selectedFirst?: unknown; profile?: { mode?: unknown; direction?: unknown } } };
    const saved = value?.settings;
    if (value?.version !== 1 || !saved || typeof saved.selectedFirst !== 'boolean') throw new Error('Invalid settings');
    if (validKey(saved.key) && validDirection(saved.direction)) return { settings: { key: saved.key, direction: saved.direction, selectedFirst: saved.selectedFirst }, error: null };
    if (saved.key === 'romaji' && validDirection(saved.direction)) return { settings: { key: 'english', direction: saved.direction, selectedFirst: saved.selectedFirst }, error: null };
    // 只兼容旧智能版设置的读取，不加载其规则、读音或后台计算。
    const profile = saved.profile;
    if (!profile || !validDirection(profile.direction)) throw new Error('Invalid settings');
    const key = profile.mode === 'zh_pinyin' ? 'pinyin' : profile.mode;
    if (validKey(key)) return { settings: { key, direction: profile.direction, selectedFirst: saved.selectedFirst }, error: null };
    if (['smart_az', 'ja_gojuon', 'by_work', 'source_order'].includes(String(profile.mode))) return { settings: { ...defaults(), selectedFirst: saved.selectedFirst }, error: null };
    throw new Error('Invalid settings');
  } catch { return { settings: defaults(), error: '排序配置损坏或版本暂不支持，暂用引用次数降序。原数据未覆盖；主动选择排序后再保存。' }; }
}

export function readSortSettings() {
  try { return parseSortSettings(localStorage.getItem(SETTINGS_KEY)); }
  catch { return { settings: defaults(), error: '无法读取排序配置，暂用引用次数降序。允许浏览器存储后可重新选择并保存。' }; }
}

export function saveSortSettings(settings: SortSettings, storage?: Pick<Storage, 'setItem'>): string | null {
  try { (storage ?? localStorage).setItem(SETTINGS_KEY, JSON.stringify({ version: 1, settings })); return null; }
  catch { return '排序配置未保存：浏览器存储不可用或空间不足。当前排序仍可用，恢复存储后可重试保存。'; }
}
