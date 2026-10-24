import { expect, it } from 'vitest';
import type { Tag } from '../types';
import { prioritizeSelectedTags, sortTags } from './tagSorting';

const tag = (id: string, zh: string, en: string, postCount?: number): Tag => ({ id, zh, en, postCount, category: 'general' });
const names = [tag('silver', '银发', 'alpha'), tag('white', '白发', 'zebra'), tag('short', '短发', 'Bravo'), tag('ahri', '阿狸', 'charlie')];

it('汉字按拼音正序而非英文或Unicode码点排序', () => {
  expect(sortTags(names, 'pinyin', 'asc').map(tag => tag.id)).toEqual(['ahri', 'white', 'short', 'silver']);
});
it('拼音倒序可以反转主排序', () => {
  expect(sortTags(names, 'pinyin', 'desc').map(tag => tag.id)).toEqual(['silver', 'short', 'white', 'ahri']);
});
it('英文排序忽略大小写，同首字母继续比较全文及自然数字', () => {
  const tags = [tag('z', '一', 'zebra'), tag('b10', '二', 'Blue 10'), tag('b2', '三', 'blue 2'), tag('a', '四', 'Alpha')];
  expect(sortTags(tags, 'english', 'asc').map(tag => tag.id)).toEqual(['a', 'b2', 'b10', 'z']);
});
it('英文倒序不修改输入数组', () => {
  expect(sortTags(names, 'english', 'desc').map(tag => tag.id)).toEqual(['white', 'ahri', 'short', 'silver']);
  expect(names[0].id).toBe('silver');
});
it('引用次数从低到高仍将缺失数据排最后', () => {
  const tags = [tag('unknown', '', 'unknown'), tag('high', '', 'high', 100), tag('zero', '', 'zero', 0), tag('low', '', 'low', 10)];
  expect(sortTags(tags, 'usage', 'asc').map(tag => tag.id)).toEqual(['zero', 'low', 'high', 'unknown']);
});
it('同拼音通过英文名稳定排列，不依赖输入次序', () => {
  expect(sortTags([tag('z', '银发', 'zebra'), tag('a', '银发', 'alpha')], 'pinyin', 'asc').map(tag => tag.id)).toEqual(['a', 'z']);
});
it('已选优先稳定分组，组内保留当前排序而非选择顺序', () => {
  const sorted = sortTags(names, 'english', 'desc');
  expect(prioritizeSelectedTags(sorted, ['silver', 'ahri']).map(tag => tag.id)).toEqual(['ahri', 'silver', 'white', 'short']);
});
it('没有已选标签时仍保持原排序，不修改已选ID顺序', () => {
  const ids = ['silver', 'ahri'];
  prioritizeSelectedTags(names, ids);
  expect(ids).toEqual(['silver', 'ahri']);
  expect(prioritizeSelectedTags(names, []).map(tag => tag.id)).toEqual(['silver', 'white', 'short', 'ahri']);
});

it('英文正倒序都将特殊字符开头的标签排在普通名称之后', () => {
  const tags = [tag('symbol', '符号', '!Alpha'), tag('z', '泽塔', 'Zulu'), tag('a', '阿尔法', 'Alpha'), tag('emoji', '表情', '😀Beta')];
  for (const direction of ['asc', 'desc'] as const) {
    const ordered = sortTags(tags, 'english', direction).map(tag => tag.id);
    expect(ordered.slice(0, 2)).toEqual(direction === 'asc' ? ['a', 'z'] : ['z', 'a']);
    expect(new Set(ordered.slice(2))).toEqual(new Set(['symbol', 'emoji']));
  }
});
it('拼音按中文显示名识别特殊开头，正倒序都将其固定置后', () => {
  const tags = [tag('symbol', '☆阿狸', 'Alpha'), tag('z', '紫发', '!Zulu'), tag('a', '阿狸', 'Alpha'), tag('fallback', '', '_Beta')];
  for (const direction of ['asc', 'desc'] as const) {
    const ordered = sortTags(tags, 'pinyin', direction).map(tag => tag.id);
    expect(ordered.slice(0, 2)).toEqual(direction === 'asc' ? ['a', 'z'] : ['z', 'a']);
    expect(new Set(ordered.slice(2))).toEqual(new Set(['symbol', 'fallback']));
  }
});
it('仅文字开头正常排序，数字和符号置后，内部标点不受影响', () => {
  const tags = [tag('underscore', '下划线', '_Alice'), tag('bracket', '括号', '(Alice)'), tag('c', '语言', 'C++'), tag('accent', '附标', ' Éclair'), tag('digit', '数字', '2B'), tag('wide', '全角', 'Ａlice')];
  for (const direction of ['asc', 'desc'] as const) {
    const ordered = sortTags(tags, 'english', direction).map(tag => tag.id);
    expect(new Set(ordered.slice(0, 3))).toEqual(new Set(['c', 'accent', 'wide']));
    expect(new Set(ordered.slice(3))).toEqual(new Set(['underscore', 'bracket', 'digit']));
  }
});
it('拼音和英文正倒序都将ASCII、全角及其他Unicode数字开头置后，已选也不提前', () => {
  const tags = [tag('ascii', '1女孩', '1girl'), tag('wide', '２个人', '２people'), tag('arabic', '٣个人', '٣people'), tag('a', '阿狸', 'Alpha'), tag('z', '紫发', 'Zulu')];
  for (const key of ['pinyin', 'english'] as const) for (const direction of ['asc', 'desc'] as const) {
    const ordered = sortTags(tags, key, direction);
    expect(ordered.slice(0, 2).map(tag => tag.id)).toEqual(direction === 'asc' ? ['a', 'z'] : ['z', 'a']);
    const prioritized = prioritizeSelectedTags(ordered, ['ascii', 'wide', 'arabic', 'z'], key);
    expect(prioritized.slice(0, 2).map(tag => tag.id)).toEqual(['z', 'a']);
    expect(new Set(prioritized.slice(2).map(tag => tag.id))).toEqual(new Set(['ascii', 'wide', 'arabic']));
  }
});
it('引用排序继续按次数，不受名称特殊字符开头影响', () => {
  const tags = [tag('special', '☆', '!Alpha', 100), tag('normal', '阿狸', 'Alpha', 10)];
  expect(sortTags(tags, 'usage', 'desc').map(tag => tag.id)).toEqual(['special', 'normal']);
});
it('开启已选优先也不会将特殊字符标签提到普通名称前', () => {
  const tags = [tag('special', '☆阿狸', '!Alpha'), tag('a', '阿狸', 'Alpha'), tag('z', '紫发', 'Zulu')];
  for (const key of ['english', 'pinyin'] as const) {
    const ordered = sortTags(tags, key, 'asc');
    expect(prioritizeSelectedTags(ordered, ['special', 'z'], key).map(tag => tag.id)).toEqual(['z', 'a', 'special']);
  }
});
