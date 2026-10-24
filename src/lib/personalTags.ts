import type { Tag, TagCategory } from '../types';
import { categories } from '../data/sampleTags';
import { getTagPaths } from './taxonomy';
import { hasNovelAiSyntaxConflict } from './novelai';

export const PERSONAL_STORAGE_KEY = 'ai-prompt-studio:personal-tags';
export type PersonalInput = { zh: string; en: string; aliases: string[]; category: TagCategory };
export type PersonalTag = PersonalInput & { id: string; archived?: boolean };
export type PersonalOverride = Omit<PersonalInput, 'en'>;
export type PersonalPreferences = { version: 1; tags: PersonalTag[]; overrides: Record<string, PersonalOverride> };
export const createPersonalPreferences = (): PersonalPreferences => ({ version: 1, tags: [], overrides: {} });
export const englishIdentity = (name: string) => name.trim().toLowerCase().replaceAll('_', ' ').replace(/\s+/g, ' ');
export function getPersonalEditingInput(tag: Tag | null, preferences: PersonalPreferences): PersonalInput {
  if (!tag) return { zh: '', en: '', aliases: [], category: 'general' };
  const override = Object.hasOwn(preferences.overrides, tag.id) ? preferences.overrides[tag.id] : undefined;
  return { zh: override?.zh ?? tag.zh, en: tag.en, category: override?.category ?? tag.category, aliases: [...(tag.id.startsWith('user:') ? tag.aliases ?? [] : override?.aliases ?? [])] };
}
const validId = (id: string) => /^user:[a-zA-Z0-9-]+$/.test(id);

function fields(input: PersonalInput): PersonalInput {
  if (!input || typeof input.zh !== 'string' || !input.zh.trim() || [...input.zh.trim()].length > 100) throw new Error('中文名需要1–100个字符。');
  if (typeof input.en !== 'string' || !input.en.trim() || input.en.length > 200 || /[,，\r\n]/.test(input.en) || hasNovelAiSyntaxConflict(input.en)) throw new Error('英文内容需要1–200字符的单个标签，不能包含逗号、换行或权重控制符。');
  if (!categories.some(category => category.id === input.category)) throw new Error('请选择有效的大类。');
  if (!Array.isArray(input.aliases) || input.aliases.length > 30 || !input.aliases.every(alias => typeof alias === 'string' && alias.length <= 100)) throw new Error('别名最多30项，每项不超过100字符。');
  return { zh: input.zh.trim(), en: input.en.trim(), category: input.category, aliases: [...new Set(input.aliases.map(alias => alias.trim()).filter(Boolean))] };
}
export function parsePersonalPreferences(raw: string | null): { preferences: PersonalPreferences | null; error: string | null } {
  if (raw === null) return { preferences: createPersonalPreferences(), error: null };
  try {
    const value = JSON.parse(raw) as PersonalPreferences;
    if (!value || value.version !== 1 || !Array.isArray(value.tags) || !value.overrides || typeof value.overrides !== 'object' || Array.isArray(value.overrides)) throw new Error('个人标签数据版本或格式暂不支持。');
    const ids = new Set<string>(), names = new Set<string>();
    const tags = value.tags.map(tag => {
      if (!tag || typeof tag.id !== 'string' || !validId(tag.id) || ids.has(tag.id) || (tag.archived !== undefined && typeof tag.archived !== 'boolean')) throw new Error('个人标签标识或归档状态无效。');
      const normalized = fields(tag), en = englishIdentity(normalized.en);
      if (names.has(en)) throw new Error('个人标签英文内容重复。');
      ids.add(tag.id); names.add(en); return { ...normalized, id: tag.id, ...(tag.archived ? { archived: true } : {}) };
    });
    const overrides = Object.fromEntries(Object.entries(value.overrides).map(([id, input]) => {
      if (!id.trim() || id.startsWith('user:') || !input) throw new Error('内置词条修正无效。');
      const normalized = fields({ ...input, en: 'original' });
      return [id, { zh: normalized.zh, aliases: normalized.aliases, category: normalized.category }];
    }));
    return { preferences: { version: 1, tags, overrides }, error: null };
  } catch (cause) { return { preferences: null, error: cause instanceof Error ? cause.message : '无法读取个人标签。' }; }
}
export function savePersonalTag(value: PersonalPreferences, id: string, input: PersonalInput, baseTags: Iterable<Tag>): PersonalPreferences {
  if (!validId(id)) throw new Error('个人标签标识无效。');
  const normalized = fields(input), identity = englishIdentity(normalized.en);
  if (value.tags.some(tag => tag.id !== id && englishIdentity(tag.en) === identity)) throw new Error('个人标签已有相同英文内容，请编辑或恢复原词条。');
  for (const tag of baseTags) if (englishIdentity(tag.en) === identity) throw new Error(`词库已有「${tag.zh}」，可以编辑它的个人译名或直接收藏。`);
  const existing = value.tags.find(tag => tag.id === id), next = { ...normalized, id };
  return { ...value, tags: existing ? value.tags.map(tag => tag.id === id ? next : tag) : [...value.tags, next] };
}
export function setPersonalOverride(value: PersonalPreferences, original: Tag, input: PersonalOverride): PersonalPreferences {
  if (original.id.startsWith('user:')) throw new Error('请直接编辑个人标签。');
  const normalized = fields({ ...input, en: 'original' });
  const override = { zh: normalized.zh, aliases: normalized.aliases, category: normalized.category };
  return { ...value, overrides: { ...value.overrides, [original.id]: override } };
}
export function resetPersonalOverride(value: PersonalPreferences, id: string): PersonalPreferences {
  return { ...value, overrides: Object.fromEntries(Object.entries(value.overrides).filter(([key]) => key !== id)) };
}
export function archivePersonalTag(value: PersonalPreferences, id: string, archived: boolean): PersonalPreferences {
  return { ...value, tags: value.tags.map(tag => tag.id === id ? { ...tag, archived } : tag) };
}
export function personalTagToTag(value: PersonalTag): Tag {
  const tag: Tag = { id: value.id, zh: value.zh, en: value.en, category: value.category, aliases: value.aliases };
  return { ...tag, searchText: [tag.zh, tag.en, ...value.aliases].join(' ').toLowerCase().replaceAll('_', ' '), subcategoryPaths: getTagPaths(tag) };
}
export function applyPersonalTags(base: Tag[], value: PersonalPreferences): { tags: Tag[]; changedPositions: number[] } {
  if (!value.tags.length && !Object.keys(value.overrides).length) return { tags: base, changedPositions: [] };
  const changedPositions: number[] = [];
  const tags = base.map((tag, position) => {
    const override = Object.hasOwn(value.overrides, tag.id) ? value.overrides[tag.id] : undefined;
    if (!override) return tag;
    changedPositions.push(position);
    const next = { ...tag, ...override, aliases: [...new Set([...(tag.aliases ?? []), tag.zh, ...override.aliases])], personalModified: true };
    return { ...next, searchText: [tag.searchText ?? '', next.zh, next.en, ...next.aliases].join(' ').toLowerCase().replaceAll('_', ' '), subcategoryPaths: override.category === tag.category ? tag.subcategoryPaths ?? getTagPaths(tag) : getTagPaths(next) };
  });
  for (const tag of value.tags) if (!tag.archived) { changedPositions.push(tags.length); tags.push(personalTagToTag(tag)); }
  return { tags, changedPositions };
}
export function mergePersonalPreferences(current: PersonalPreferences, incoming: PersonalPreferences, newId: () => string = () => `user:${crypto.randomUUID()}`): { preferences: PersonalPreferences; idMap: Map<string, string> } {
  const preferences = structuredClone(current), idMap = new Map<string, string>();
  const used = new Set(preferences.tags.map(tag => tag.id));
  for (const tag of incoming.tags) {
    const existing = preferences.tags.find(other => englishIdentity(other.en) === englishIdentity(tag.en));
    if (existing) { idMap.set(tag.id, existing.id); continue; }
    let id = tag.id;
    if (used.has(id)) {
      for (let attempt = 0; attempt < 1000; attempt++) { id = newId(); if (validId(id) && !used.has(id)) break; }
      if (!validId(id) || used.has(id)) throw new Error('无法生成个人标签标识，请重试。');
    }
    used.add(id); idMap.set(tag.id, id); preferences.tags.push({ ...structuredClone(tag), id });
  }
  preferences.overrides = { ...structuredClone(incoming.overrides), ...preferences.overrides };
  return { preferences, idMap };
}
