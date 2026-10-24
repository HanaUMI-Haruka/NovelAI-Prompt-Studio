export type PaginationItem = number | '…';

export function getPaginationItems(page: number, pageCount: number): PaginationItem[] {
  if (pageCount <= 9) return Array.from({ length: pageCount }, (_, i) => i + 1);
  let start = Math.max(2, page - 2);
  let end = Math.min(pageCount - 1, page + 2);
  if (page <= 4) end = Math.min(pageCount - 1, 6);
  if (page >= pageCount - 3) start = Math.max(2, pageCount - 5);
  const items: PaginationItem[] = [1];
  if (start === 3) items.push(2);
  else if (start > 3) items.push('…');
  for (let value = start; value <= end; value++) items.push(value);
  if (end === pageCount - 2) items.push(pageCount - 1);
  else if (end < pageCount - 2) items.push('…');
  items.push(pageCount);
  return items;
}

export function parsePageTarget(text: string, pageCount: number): number | null {
  const value = text.trim();
  if (!/^\d+$/.test(value)) return null;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 && page <= pageCount ? page : null;
}
