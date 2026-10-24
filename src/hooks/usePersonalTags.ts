import { useEffect, useState } from 'react';
import { archivePersonalTag, createPersonalPreferences, parsePersonalPreferences, PERSONAL_STORAGE_KEY, resetPersonalOverride, savePersonalTag, setPersonalOverride } from '../lib/personalTags';
import type { PersonalInput, PersonalOverride, PersonalPreferences } from '../lib/personalTags';
import type { Tag } from '../types';

function load() {
  try { const result = parsePersonalPreferences(localStorage.getItem(PERSONAL_STORAGE_KEY)); return { preferences: result.preferences ?? createPersonalPreferences(), error: result.error, blocked: Boolean(result.error) }; }
  catch { return { preferences: createPersonalPreferences(), error: '无法读取个人标签，已暂停写入。允许浏览器存储后请重新读取。', blocked: true }; }
}
export function usePersonalTags() {
  const [initial] = useState(load), [preferences, setPreferences] = useState(initial.preferences), [error, setError] = useState(initial.error), [blocked, setBlocked] = useState(initial.blocked);
  function persist(value: PersonalPreferences) {
    try { localStorage.setItem(PERSONAL_STORAGE_KEY, JSON.stringify(value)); setError(null); }
    catch { setError('个人标签尚未保存：浏览器存储不可用或空间不足。当前页面仍可使用，请重试保存或导出备份。'); }
  }
  useEffect(() => { if (!blocked) persist(preferences); }, [preferences, blocked]);
  function change(action: (value: PersonalPreferences) => PersonalPreferences) { if (blocked) throw new Error('个人标签原数据尚未读取成功，已暂停修改。'); setPreferences(action(preferences)); }
  return { preferences, error, blocked,
    save: (id: string, input: PersonalInput, base: Iterable<Tag>) => change(value => savePersonalTag(value, id, input, base)),
    override: (original: Tag, input: PersonalOverride) => change(value => setPersonalOverride(value, original, input)),
    reset: (id: string) => change(value => resetPersonalOverride(value, id)),
    archive: (id: string, archived: boolean) => change(value => archivePersonalTag(value, id, archived)),
    retry: () => { if (!blocked) persist(preferences); },
    reload: () => { const value = load(); setPreferences(value.preferences); setError(value.error); setBlocked(value.blocked); },
    restore: (value: PersonalPreferences) => { setPreferences(value); setError(null); setBlocked(false); },
  };
}
export type PersonalController = ReturnType<typeof usePersonalTags>;
