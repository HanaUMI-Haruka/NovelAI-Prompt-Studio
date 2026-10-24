import type { Tag } from '../types';
import { hasSpecialPrefix, sortTags } from './tagSorting';
import type { SortDirection, TagSortKey } from './tagSorting';

export const ORDER_KEYS = ['usage:asc', 'usage:desc', 'pinyin:asc', 'pinyin:desc', 'english:asc', 'english:desc'] as const;
export type CatalogSortIndex = Record<typeof ORDER_KEYS[number], Uint32Array>;
const MAGIC = 0x31535041;
const HEADER_BYTES = 80;

// 只对当前数据内容做校验，不生成读音、身份或其他排序规则。
export async function getCatalogFingerprint(tags: Tag[]): Promise<string> {
  const text = tags.map(tag => JSON.stringify([tag.id, tag.rawName ?? tag.en, tag.en, tag.zh, tag.postCount ?? null])).join('\n');
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`simple-sort-v1/special-prefix-last-v2\n${text}`));
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

// 仅在生成本地资源时运行。交互页面直接读取生成好的六份顺序。
export function buildCatalogSortIndex(tags: Tag[]): CatalogSortIndex {
  const positions = new Map(tags.map((tag, index) => [tag, index]));
  return Object.fromEntries(ORDER_KEYS.map(order => {
    const [key, direction] = order.split(':') as [TagSortKey, SortDirection];
    return [order, Uint32Array.from(sortTags(tags, key, direction), tag => positions.get(tag)!)];
  })) as CatalogSortIndex;
}

export function encodeCatalogSortIndex(index: CatalogSortIndex, fingerprint: string): ArrayBuffer {
  const total = index[ORDER_KEYS[0]].length;
  const buffer = new ArrayBuffer(HEADER_BYTES + total * ORDER_KEYS.length * 4);
  const view = new DataView(buffer);
  view.setUint32(0, MAGIC, true); view.setUint32(4, 1, true); view.setUint32(8, total, true);
  new Uint8Array(buffer, 16, 64).set(new TextEncoder().encode(fingerprint));
  let offset = HEADER_BYTES;
  for (const order of ORDER_KEYS) for (const position of index[order]) { view.setUint32(offset, position, true); offset += 4; }
  return buffer;
}

export function decodeCatalogSortIndex(buffer: ArrayBuffer, total: number, fingerprint: string): CatalogSortIndex {
  if (buffer.byteLength !== HEADER_BYTES + total * ORDER_KEYS.length * 4) throw new Error('排序资源长度不匹配');
  const view = new DataView(buffer);
  if (view.getUint32(0, true) !== MAGIC || view.getUint32(4, true) !== 1 || view.getUint32(8, true) !== total || new TextDecoder().decode(new Uint8Array(buffer, 16, 64)) !== fingerprint) throw new Error('排序资源与词库版本不匹配');
  const result = {} as CatalogSortIndex;
  const seen = new Uint8Array(total);
  const littleEndian = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  let offset = HEADER_BYTES;
  for (const order of ORDER_KEYS) {
    const positions = littleEndian ? new Uint32Array(buffer, offset, total) : Uint32Array.from({ length: total }, (_, i) => view.getUint32(offset + i * 4, true));
    seen.fill(0);
    for (const position of positions) {
      if (position >= total || seen[position]) throw new Error('排序资源包含越界或重复条目');
      seen[position] = 1;
    }
    result[order] = positions; offset += total * 4;
  }
  return result;
}

export function getIndexedTagPage(tags: Tag[], index: CatalogSortIndex, scope: ReadonlySet<string> | null, key: TagSortKey, direction: SortDirection, page: number, pageSize = 60, selectedIds: string[] = []): Tag[] {
  const order = index[`${key}:${direction}`];
  const selected = new Set(selectedIds.filter(id => !scope || scope.has(id)));
  const result: Tag[] = []; const skip = (page - 1) * pageSize;
  let accepted = 0;
  // 索引已经将特殊开头置后。只有已选优先需要找到分界，在两个组内分别优先。
  let boundary = order.length;
  if (selected.size && key !== 'usage') {
    let low = 0; let high = order.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (hasSpecialPrefix(tags[order[middle]], key)) high = middle;
      else low = middle + 1;
    }
    boundary = low;
  }
  for (const [start, end] of boundary < order.length ? [[0, boundary], [boundary, order.length]] : [[0, order.length]]) {
    for (const selectedPhase of selected.size ? [true, false] : [false]) {
      let remaining = selected.size;
      for (let i = start; i < end; i++) {
        const tag = tags[order[i]];
        if ((scope && !scope.has(tag.id)) || selected.has(tag.id) !== selectedPhase) continue;
        if (accepted++ >= skip) { result.push(tag); if (result.length === pageSize) return result; }
        if (selectedPhase && --remaining === 0) break;
      }
    }
  }
  return result;
}
