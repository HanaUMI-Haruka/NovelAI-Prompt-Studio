import type { Tag } from '../types';
import { getIndexedTagPage, ORDER_KEYS } from './catalogSortIndex';
import type { CatalogSortIndex } from './catalogSortIndex';
import { createTagComparator, hasSpecialPrefix, sortTags } from './tagSorting';
import type { SortDirection, TagSortKey } from './tagSorting';

export type PersonalSortOverlay = { baseTags: Tag[]; changed: Set<number>; orders: CatalogSortIndex };
export function buildPersonalSortOverlay(baseTags: Tag[], tags: Tag[], positions: number[]): PersonalSortOverlay | null {
  if (!positions.length) return null;
  const changed = new Set(positions), actual = new Map(positions.map(position => [tags[position], position]));
  const small = positions.map(position => tags[position]);
  const orders = Object.fromEntries(ORDER_KEYS.map(order => {
    const [key, direction] = order.split(':') as [TagSortKey, SortDirection];
    return [order, Uint32Array.from(sortTags(small, key, direction), tag => actual.get(tag)!)];
  })) as CatalogSortIndex;
  return { baseTags, changed, orders };
}

// 只合并当前页需要的顺序；不为个人词条重新排序或复制33万条索引。
export function getPersonalizedTagPage(tags: Tag[], index: CatalogSortIndex, scope: ReadonlySet<string> | null, key: TagSortKey, direction: SortDirection, page: number, pageSize = 60, selectedIds: string[] = [], overlay: PersonalSortOverlay | null = null): Tag[] {
  if (!overlay) return getIndexedTagPage(tags, index, scope, key, direction, page, pageSize, selectedIds);
  const base = index[`${key}:${direction}`], extra = overlay.orders[`${key}:${direction}`], compare = createTagComparator(key, direction);
  const selected = new Set(selectedIds.filter(id => !scope || scope.has(id)));
  function boundary(order: Uint32Array, source: Tag[]) {
    if (key === 'usage') return order.length;
    let low = 0, high = order.length;
    while (low < high) { const middle = (low + high) >>> 1; if (hasSpecialPrefix(source[order[middle]], key)) high = middle; else low = middle + 1; }
    return low;
  }
  const b = boundary(base, overlay.baseTags), e = boundary(extra, tags);
  function* merge(start: number, end: number, extraStart: number, extraEnd: number) {
    let i = start, j = extraStart;
    while (i < end || j < extraEnd) {
      while (i < end && overlay!.changed.has(base[i])) i++;
      if (i >= end && j >= extraEnd) return;
      if (i < end && (j >= extraEnd || compare(tags[base[i]], tags[extra[j]]) <= 0)) yield base[i++];
      else yield extra[j++];
    }
  }
  let accepted = 0; const skip = (page - 1) * pageSize, result: Tag[] = [];
  for (const [start, end, es, ee] of [[0, b, 0, e], [b, base.length, e, extra.length]]) {
    for (const selectedPhase of selected.size ? [true, false] : [false]) {
      let remaining = selected.size;
      for (const position of merge(start, end, es, ee)) {
        const tag = tags[position];
        if ((scope && !scope.has(tag.id)) || selected.has(tag.id) !== selectedPhase) continue;
        if (accepted++ >= skip) { result.push(tag); if (result.length === pageSize) return result; }
        if (selectedPhase && --remaining === 0) break;
      }
    }
  }
  return result;
}
