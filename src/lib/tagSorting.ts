import type { Tag } from '../types';
export type TagSortKey = 'usage' | 'pinyin' | 'english';
export type SortDirection = 'asc' | 'desc';

const english = new Intl.Collator('en', { numeric: true, sensitivity: 'base', ignorePunctuation: true });
const pinyin = new Intl.Collator('zh-Hans-CN-u-co-pinyin', { numeric: true, sensitivity: 'base', ignorePunctuation: true });
const knownCount = (count: number | undefined): count is number => typeof count === 'number' && Number.isFinite(count) && count >= 0;

export function hasSpecialPrefix(tag: Tag, key: TagSortKey): boolean {
  if (key === 'usage') return false;
  const name = key === 'pinyin' ? tag.zh.trim() || tag.en : tag.en;
  return !/^\p{L}/u.test(name.trimStart());
}

function compareCodePoints(a: string, b: string): number {
  if (a === b) return 0;
  let ai = 0; let bi = 0;
  while (ai < a.length && bi < b.length) {
    const ac = a.codePointAt(ai)!; const bc = b.codePointAt(bi)!;
    if (ac !== bc) return ac < bc ? -1 : 1;
    ai += ac > 0xffff ? 2 : 1; bi += bc > 0xffff ? 2 : 1;
  }
  return ai < a.length ? 1 : -1;
}

export function createTagComparator(key: TagSortKey, direction: SortDirection, special?: ReadonlyMap<Tag, number>) {
  const sign = direction === 'asc' ? 1 : -1;
  return (a: Tag, b: Tag): number => {
    if (key === 'usage') {
      const aKnown = knownCount(a.postCount);
      const bKnown = knownCount(b.postCount);
      // 缺失数据不参与正倒序，始终置于有统计的词条之后。
      if (aKnown !== bKnown) return aKnown ? -1 : 1;
      const countDifference = aKnown && bKnown ? a.postCount! - b.postCount! : 0;
      return sign * countDifference || compareCodePoints(a.rawName ?? a.en, b.rawName ?? b.en) || compareCodePoints(a.id, b.id);
    }
    // 组的位置不随方向反转；仅在普通组和特殊字符组内部反转主序。
    const groupDifference = special ? special.get(a)! - special.get(b)! : Number(hasSpecialPrefix(a, key)) - Number(hasSpecialPrefix(b, key));
    if (groupDifference) return groupDifference;
    const difference = key === 'pinyin'
      ? pinyin.compare(a.zh.trim() || a.en, b.zh.trim() || b.en)
      : english.compare(a.en.replaceAll('_', ' '), b.en.replaceAll('_', ' '));
    return sign * difference || english.compare(a.en, b.en) || compareCodePoints(a.rawName ?? a.en, b.rawName ?? b.en) || compareCodePoints(a.id, b.id);
  };
}

export function sortTags(tags: Tag[], key: TagSortKey, direction: SortDirection): Tag[] {
  const special = key === 'usage' ? undefined : new Map(tags.map(tag => [tag, Number(hasSpecialPrefix(tag, key))]));
  return [...tags].sort(createTagComparator(key, direction, special));
}

export function prioritizeSelectedTags(tags: Tag[], selectedIds: string[], key?: TagSortKey): Tag[] {
  if (!selectedIds.length) return tags;
  const selected = new Set(selectedIds);
  const first: Tag[] = [];
  const rest: Tag[] = [];
  const specialFirst: Tag[] = [];
  const specialRest: Tag[] = [];
  for (const tag of tags) {
    if (key && hasSpecialPrefix(tag, key)) (selected.has(tag.id) ? specialFirst : specialRest).push(tag);
    else (selected.has(tag.id) ? first : rest).push(tag);
  }
  return [...first, ...rest, ...specialFirst, ...specialRest];
}

export function getTagSortLabel(key: TagSortKey, direction: SortDirection): string {
  if (key === 'usage') return direction === 'desc' ? '按引用次数从高到低' : '按引用次数从低到高';
  const name = key === 'pinyin' ? '按汉语拼音' : '按英文名称';
  return `${name} ${direction === 'asc' ? 'A → Z' : 'Z → A'}`;
}
