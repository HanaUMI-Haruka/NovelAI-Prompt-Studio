import type { Tag } from '../types';
import { hasNovelAiSyntaxConflict, toNovelAiTag } from './novelai';

export function normalizeTag(value: string): string { return value.trim(); }

export function uniqueTags(values: string[]): string[] {
  const seen = new Set<string>();
  return values.map(normalizeTag).filter(value => {
    const key = value.toLowerCase();
    if (!value || seen.has(key)) return false;
    seen.add(key); return true;
  });
}

export function moveSelectedTag(ids: string[], activeId: string, overId: string | null): string[] {
  if (overId === null || activeId === overId) return ids;
  const from = ids.indexOf(activeId); const to = ids.indexOf(overId);
  if (from < 0 || to < 0) return ids;
  const next = [...ids]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
  return next;
}

export function normalizeWeight(value: number): number {
  return Number.isFinite(value) && value >= 0 && value <= 3 ? Math.round(value * 100) / 100 : 1;
}

export function buildPrompt(ids: string[], custom: string, tags: Tag[], weights: Record<string, number> = {}, disabledTagIds: string[] = []): string {
  const selectedIds = new Set(ids);
  const disabled = new Set(disabledTagIds);
  // 只对所选词条建索引，避免每次调权都索引整个大词典。
  const dictionary = new Map(tags.filter(tag => selectedIds.has(tag.id)).map(tag => [tag.id, tag.rawName ? toNovelAiTag(tag.rawName) : tag.en]));
  const seen = new Set<string>();
  const output: string[] = [];
  function append(value: string, weight = 1) {
    const text = normalizeTag(value);
    const key = text.toLowerCase().replaceAll('_', ' ');
    if (!text || seen.has(key)) return;
    seen.add(key);
    const normalized = normalizeWeight(weight);
    output.push(normalized === 1 ? text : `${normalized}::${text} ::`);
  }
  for (const id of ids) {
    if (disabled.has(id)) continue;
    const text = dictionary.get(id) ?? (id.startsWith('db:') ? toNovelAiTag(id.slice(3)) : '');
    // 冲突词条由界面明确标注并阻止复制；预览只显示其余可兼容内容。
    if (!hasNovelAiSyntaxConflict(text)) append(text, weights[id] ?? 1);
  }
  for (const text of custom.split(/[,，\n\r]+/)) append(text);
  return output.join(', ');
}

export function matchesTag(tag: Tag, query: string): boolean {
  const normalized = query.trim().toLowerCase().replaceAll('_', ' ');
  return tag.searchText ? tag.searchText.includes(normalized) : [tag.zh, tag.en, tag.rawName ?? '', ...(tag.aliases ?? [])].some(value => value.toLowerCase().replaceAll('_', ' ').includes(normalized));
}
