import { themes } from '../data/themes';
import type { ThemeId } from '../data/themes';

export const APPEARANCE_KEY = 'ai-prompt-studio:appearance';
export type AppearanceState = { theme: ThemeId; error: string | null };

export function parseAppearance(raw: string | null): AppearanceState {
  if (raw === null) return { theme: 'sky', error: null };
  try {
    const value = JSON.parse(raw) as { version?: unknown; theme?: unknown } | null;
    const theme = themes.find(item => item.id === value?.theme);
    if (value?.version !== 1 || !theme) throw new Error('Invalid theme');
    return { theme: theme.id, error: null };
  } catch {
    return { theme: 'sky', error: '外观偏好无法识别，暂用晴空蓝白。原数据未覆盖，重新选择主题后可保存。' };
  }
}

export function readAppearance(storage?: Pick<Storage, 'getItem'>): AppearanceState {
  try { return parseAppearance((storage ?? localStorage).getItem(APPEARANCE_KEY)); }
  catch { return { theme: 'sky', error: '无法读取外观设置，暂用晴空蓝白；允许本地存储后可重新选择并保存。' }; }
}

export function saveAppearance(theme: ThemeId, storage?: Pick<Storage, 'setItem'>): string | null {
  try { (storage ?? localStorage).setItem(APPEARANCE_KEY, JSON.stringify({ version: 1, theme })); return null; }
  catch { return '外观设置未保存：浏览器存储不可用或空间不足。当前外观仍可使用，请恢复存储后重试保存。'; }
}

export function applyAppearance(id: ThemeId) {
  const theme = themes.find(item => item.id === id)!;
  document.documentElement.dataset.theme = id;
  document.documentElement.style.colorScheme = theme.mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.color);
}
