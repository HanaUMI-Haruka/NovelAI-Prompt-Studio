import { expect, it } from 'vitest';
import { buildCatalogSortIndex, decodeCatalogSortIndex, encodeCatalogSortIndex, getCatalogFingerprint, getIndexedTagPage, ORDER_KEYS } from './catalogSortIndex';
import { prioritizeSelectedTags, sortTags } from './tagSorting';
import type { Tag } from '../types';

const tags: Tag[] = [
  { id: 's', zh: '银发', en: 'silver hair', category: 'hair', postCount: 100 },
  { id: 'b', zh: '白发', en: 'Blue 10', category: 'hair', postCount: 0 },
  { id: 'a', zh: '阿狸', en: 'blue 2', category: 'general', postCount: 100 },
  { id: 'u', zh: '未知', en: 'unknown', category: 'general' },
  { id: 'tie', zh: '银发', en: 'silver hair', category: 'hair', postCount: 100 },
];

it('六种预存顺序覆盖三种排序及正倒序，缺失引用仍置后', async () => {
  const index = await buildCatalogSortIndex(tags);
  for (const key of ['usage', 'pinyin', 'english'] as const) for (const direction of ['asc', 'desc'] as const) {
    expect(getIndexedTagPage(tags, index, null, key, direction, 1, 99)).toEqual(sortTags(tags, key, direction));
  }
});
it('筛选、已选优先与跨页组合沿用完整顺序，不按选择顺序输出', async () => {
  const index = await buildCatalogSortIndex(tags);
  const scope = new Set(['s', 'a', 'tie']); const selected = ['s', 'a', 'not-in-catalog'];
  const expected = prioritizeSelectedTags(sortTags(tags.filter(tag => scope.has(tag.id)), 'english', 'desc'), selected);
  const page = (n: number) => getIndexedTagPage(tags, index, scope, 'english', 'desc', n, 2, selected);
  expect([...page(1), ...page(2)]).toEqual(expected);
  expect(getIndexedTagPage(tags, index, new Set(), 'pinyin', 'asc', 1)).toEqual([]);
});
it('索引以紧凑二进制往返，错误版本、数据集、越界或重复条目必须拒绝', async () => {
  const index = await buildCatalogSortIndex(tags); const fingerprint = await getCatalogFingerprint(tags);
  const encoded = encodeCatalogSortIndex(index, fingerprint);
  const decoded = decodeCatalogSortIndex(encoded, tags.length, fingerprint);
  for (const key of ORDER_KEYS) expect([...decoded[key]]).toEqual([...index[key]]);
  expect(() => decodeCatalogSortIndex(encoded, tags.length + 1, fingerprint)).toThrow();
  expect(() => decodeCatalogSortIndex(encoded, tags.length, '0'.repeat(64))).toThrow();
  const version = encoded.slice(0); new DataView(version).setUint32(4, 99, true);
  expect(() => decodeCatalogSortIndex(version, tags.length, fingerprint)).toThrow();
  const duplicate = encoded.slice(0); new DataView(duplicate).setUint32(84, new DataView(duplicate).getUint32(80, true), true);
  expect(() => decodeCatalogSortIndex(duplicate, tags.length, fingerprint)).toThrow();
  const outOfRange = encoded.slice(0); new DataView(outOfRange).setUint32(80, tags.length, true);
  expect(() => decodeCatalogSortIndex(outOfRange, tags.length, fingerprint)).toThrow();
  expect(() => decodeCatalogSortIndex(encoded.slice(0, -4), tags.length, fingerprint)).toThrow();
});
it('指纹包含真实排序字段及条目位置，词库变化不能误用旧顺序', async () => {
  const original = await getCatalogFingerprint(tags);
  for (const patch of [{ zh: '改变' }, { en: 'changed' }, { postCount: 101 }, { rawName: 'raw_changed' }, { id: 'changed' }]) {
    expect(await getCatalogFingerprint([{ ...tags[0], ...patch }, ...tags.slice(1)])).not.toBe(original);
  }
  expect(await getCatalogFingerprint([...tags].reverse())).not.toBe(original);
});
it('索引就绪后的切换与翻页不再调用字符比较或Array.sort', async () => {
  const index = await buildCatalogSortIndex(tags);
  const original = Array.prototype.sort;
  Array.prototype.sort = () => { throw new Error('不允许在切换时重新排序'); };
  try {
    for (const key of ['usage', 'pinyin', 'english'] as const) for (const direction of ['asc', 'desc'] as const) {
      expect(getIndexedTagPage(tags, index, null, key, direction, 1, 2)).toHaveLength(2);
    }
  } finally { Array.prototype.sort = original; }
});
it('预存顺序与已选优先跨页组合也始终将特殊字符名称置后', () => {
  const mixed: Tag[] = [
    { id: 's1', zh: '☆阿狸', en: '!Alpha', category: 'general' },
    { id: 'a', zh: '阿狸', en: 'Alpha', category: 'general' },
    { id: 'z', zh: '紫发', en: 'Zulu', category: 'general' },
    { id: 's2', zh: '☆紫发', en: '!Zulu', category: 'general' },
  ];
  const index = buildCatalogSortIndex(mixed);
  for (const key of ['pinyin', 'english'] as const) for (const direction of ['asc', 'desc'] as const) {
    const first = getIndexedTagPage(mixed, index, null, key, direction, 1, 2, ['s2', 'z']);
    const last = getIndexedTagPage(mixed, index, null, key, direction, 2, 2, ['s2', 'z']);
    expect([...first, ...last].map(tag => tag.id)).toEqual(['z', 'a', 's2', 's1']);
  }
});
it('排序规则更新后拒绝只按旧版规则生成的顺序资源', async () => {
  const text = tags.map(tag => JSON.stringify([tag.id, tag.rawName ?? tag.en, tag.en, tag.zh, tag.postCount ?? null])).join('\n');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`simple-sort-v1\n${text}`));
  const oldFingerprint = [...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const oldResource = encodeCatalogSortIndex(buildCatalogSortIndex(tags), oldFingerprint);
  expect(() => decodeCatalogSortIndex(oldResource, tags.length, '')).toThrow();
  const current = await getCatalogFingerprint(tags);
  expect(current).not.toBe(oldFingerprint);
  expect(() => decodeCatalogSortIndex(oldResource, tags.length, current)).toThrow();
});
it('数字与符号共同置后，预存顺序的筛选、已选优先和跨页仍正确', () => {
  const mixed: Tag[] = [
    { id: 'n', zh: '1女孩', en: '1girl', category: 'general' },
    { id: 'a', zh: '阿狸', en: 'Alpha', category: 'general' },
    { id: 'z', zh: '紫发', en: 'Zulu', category: 'general' },
    { id: 's', zh: '☆阿狸', en: '!Alpha', category: 'general' },
    { id: 'extra', zh: '2个人', en: '2people', category: 'general' },
  ];
  const index = buildCatalogSortIndex(mixed); const scope = new Set(['n', 'a', 'z', 's']);
  for (const key of ['pinyin', 'english'] as const) for (const direction of ['asc', 'desc'] as const) {
    const page = (n: number) => getIndexedTagPage(mixed, index, scope, key, direction, n, 2, ['n', 'z']);
    expect([...page(1), ...page(2)].map(tag => tag.id)).toEqual(['z', 'a', 'n', 's']);
  }
});
