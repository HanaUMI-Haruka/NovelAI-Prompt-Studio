import { expect, it } from 'vitest';
import { buildCatalogSortIndex } from './catalogSortIndex';
import { buildPersonalSortOverlay, getPersonalizedTagPage } from './personalSortOverlay';
import { prioritizeSelectedTags, sortTags } from './tagSorting';
import type { Tag } from '../types';
const base: Tag[] = [{ id: 'a', zh: '阿', en: 'alpha', category: 'general', postCount: 10 }, { id: 'b', zh: '中', en: 'beta', category: 'general', postCount: 2 }, { id: 'c', zh: '1数', en: '1number', category: 'general', postCount: 0 }];
it('仅排序个人变化流，六种方向分页与完整排序一致，符号数字始终置后', () => {
  const tags = [base[0], { ...base[1], zh: '字' }, base[2], { id: 'user:n', zh: '#个人', en: '#personal', category: 'general' as const }, { id: 'user:m', zh: '安', en: 'aardvark', category: 'general' as const }];
  const index = buildCatalogSortIndex(base), overlay = buildPersonalSortOverlay(base, tags, [1, 3, 4]);
  for (const key of ['pinyin', 'english', 'usage'] as const) for (const direction of ['asc', 'desc'] as const) {
    const expected = sortTags(tags, key, direction);
    expect([1, 2, 3].flatMap(page => getPersonalizedTagPage(tags, index, null, key, direction, page, 2, [], overlay))).toEqual(expected);
  }
});
it('个人流与筛选、已选优先结合，仍保持组内原排序', () => {
  const tags = [...base, { id: 'user:n', zh: '#个人', en: '#personal', category: 'general' as const }];
  const index = buildCatalogSortIndex(base), overlay = buildPersonalSortOverlay(base, tags, [3]), scope = new Set(['b', 'c', 'user:n']);
  const expected = prioritizeSelectedTags(sortTags(tags.filter(t => scope.has(t.id)), 'english', 'desc'), ['user:n', 'b'], 'english');
  expect(getPersonalizedTagPage(tags, index, scope, 'english', 'desc', 1, 60, ['user:n', 'b'], overlay)).toEqual(expected);
});
