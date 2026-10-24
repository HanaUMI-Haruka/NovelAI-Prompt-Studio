import { useState } from 'react';
import { readSortSettings, saveSortSettings } from '../lib/sortPreferences';
import type { SortSettings } from '../lib/sortPreferences';

export function useSortPreferences() {
  const [initial] = useState(readSortSettings);
  const [settings, setSettings] = useState(initial.settings);
  const [error, setError] = useState(initial.error);
  return { settings, error,
    change: (value: SortSettings) => { setSettings(value); setError(saveSortSettings(value)); },
    retry: () => setError(saveSortSettings(settings)),
    restore: (value: SortSettings) => { setSettings(value); setError(null); },
  };
}
export type SortController = ReturnType<typeof useSortPreferences>;
