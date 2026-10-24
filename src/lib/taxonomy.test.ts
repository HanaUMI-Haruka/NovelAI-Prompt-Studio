import { expect, it } from 'vitest';
import type { Tag, TagCategory } from '../types';
import { formatPostCount, getTagPaths, matchesTagPath, sortTagsByUsage } from './taxonomy';

const tag = (category: TagCategory, rawName: string, postCount?: number): Tag => ({ id: rawName, rawName, en: rawName, zh: rawName, category, postCount });

it('服装按三级路径细分，cape不因cap子串被误认为帽子', () => {
  expect(getTagPaths(tag('clothing', 'baseball_cap'))).toContainEqual(['upper', 'hats']);
  expect(getTagPaths(tag('clothing', 'cape'))).toContainEqual(['upper', 'outerwear']);
  expect(getTagPaths(tag('clothing', 'cape'))).not.toContainEqual(['upper', 'hats']);
});
it('下半身裤裙和连体服装分开', () => {
  expect(getTagPaths(tag('clothing', 'pleated_skirt'))).toContainEqual(['lower', 'skirts']);
  expect(getTagPaths(tag('clothing', 'jeans'))).toContainEqual(['lower', 'pants']);
  expect(getTagPaths(tag('clothing', 'dress'))).toContainEqual(['fullbody', 'dresses']);
});
it('发色与卷发可多归属，父级包含后代', () => {
  const paths = getTagPaths(tag('hair', 'black_curly_hair'));
  expect(paths).toContainEqual(['color']); expect(paths).toContainEqual(['shape', 'curly']);
  expect(matchesTagPath(paths, ['shape'])).toBe(true); expect(matchesTagPath(paths, ['shape', 'braids'])).toBe(false);
});
it('服装颜色可与上衣同时归类，全部路径不过滤标签', () => {
  const paths = getTagPaths(tag('clothing', 'white_shirt'));
  expect(paths).toContainEqual(['upper', 'tops']); expect(paths).toContainEqual(['details', 'color']);
  expect(matchesTagPath(paths, [])).toBe(true);
});
it('作品保留跨媒介归属和明确媒介限定', () => {
  expect(getTagPaths(tag('copyright', 'pokemon'))).toContainEqual(['games']);
  expect(getTagPaths(tag('copyright', 'pokemon'))).toContainEqual(['anime']);
  expect(getTagPaths(tag('copyright', 'one_piece'))).toContainEqual(['manga']);
  expect(getTagPaths(tag('copyright', 'unlisted_title_(anime)'))).toEqual([['anime']]);
});
it('未知作品与无依据的中文名称进入待细分', () => {
  expect(getTagPaths({ ...tag('copyright', 'unknown_title'), zh: '游戏动画漫画大冒险' })).toEqual([['other']]);
  expect(getTagPaths(tag('clothing', 'unknown_item'))).toEqual([['other']]);
});
it('引用次数数值降序，同次数按英文名稳定排序，未知置后且不修改输入', () => {
  const input = [tag('clothing', 'unknown'), tag('clothing', 'z', 10), tag('clothing', 'a', 10), tag('clothing', 'zero', 0), tag('clothing', 'popular', 100)];
  expect(sortTagsByUsage(input).map(item => item.id)).toEqual(['popular', 'a', 'z', 'zero', 'unknown']);
  expect(input[0].id).toBe('unknown');
});
it('引用次数精确展示，零不误认为缺失，不虚构百分比', () => {
  expect(formatPostCount(123456)).toBe('123,456 次引用'); expect(formatPostCount(0)).toBe('0 次引用');
  expect(formatPostCount(undefined)).toBe('暂无引用数据');
});
