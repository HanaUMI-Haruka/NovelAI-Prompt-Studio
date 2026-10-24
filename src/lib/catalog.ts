import { categories, sampleTags } from '../data/sampleTags';
import type { Tag, TagCategory } from '../types';
import { toNovelAiTag } from './novelai';
import { getTagPaths, sortTagsByUsage } from './taxonomy';

const categoryIds = new Set(categories.map(category => category.id));
const normalizeName = (value: string) => value.toLowerCase().replaceAll('_', ' ').trim();

export function decodeCatalog(input: unknown): Tag[] {
  if (!Array.isArray(input) || !input.length) throw new Error('标签库文件为空或格式不正确');
  const builtins = new Map(sampleTags.map(tag => [normalizeName(tag.en), tag]));
  const seen = new Set<string>();
  const merged = new Set<string>();
  const tags: Tag[] = [];
  for (const [sourceOrder, row] of input.entries()) {
    if (!Array.isArray(row) || row.length !== 5 || typeof row[0] !== 'string' || !row[0].trim() ||
        typeof row[1] !== 'string' || !row[1].trim() || ![0, 1, 3, 4, 5].includes(row[2]) ||
        typeof row[3] !== 'number' || !Number.isFinite(row[3]) || row[3] < 0 || !categoryIds.has(row[4])) {
      throw new Error('标签库数据字段无效，请检查本地数据文件');
    }
    const [rawName, zh, sourceCategory, postCount, category] = row as [string, string, number, number, TagCategory];
    if (seen.has(rawName)) continue;
    seen.add(rawName);
    const builtin = builtins.get(normalizeName(rawName));
    if (builtin) merged.add(builtin.id);
    const tag: Tag = {
      id: builtin?.id ?? `db:${rawName}`, zh: builtin?.zh ?? zh,
      en: builtin?.en ?? toNovelAiTag(rawName), category: builtin?.category ?? category,
      rawName, postCount, sourceCategory, sourceOrder,
      ...(builtin ? { aliases: [...(builtin.aliases ?? []), zh] } : {}),
    };
    tag.searchText = [tag.zh, tag.en, rawName, ...(tag.aliases ?? [])].join('\n').toLowerCase().replaceAll('_', ' ');
    tag.subcategoryPaths = getTagPaths(tag);
    tags.push(tag);
  }
  return sortTagsByUsage([...tags, ...sampleTags.filter(tag => !merged.has(tag.id)).map((tag, index) => ({ ...tag, sourceOrder: input.length + index, subcategoryPaths: getTagPaths(tag) }))]);
}
