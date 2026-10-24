import { useLayoutEffect, useState } from 'react';
import { applyAppearance, saveAppearance } from '../lib/appearance';
import type { AppearanceState } from '../lib/appearance';
import type { ThemeId } from '../data/themes';

export function useAppearance(initial: AppearanceState) {
  const [theme, setTheme] = useState(initial.theme);
  const [error, setError] = useState(initial.error);
  useLayoutEffect(() => applyAppearance(theme), [theme]);
  return {
    theme, error,
    select: (id: ThemeId) => { setTheme(id); setError(saveAppearance(id)); },
    retry: () => setError(saveAppearance(theme)),
    restore: (id: ThemeId) => { setTheme(id); setError(null); },
  };
}
