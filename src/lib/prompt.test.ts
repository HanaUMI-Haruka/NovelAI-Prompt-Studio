import { describe, expect, it } from 'vitest';
import { buildPrompt, matchesTag, normalizeTag, uniqueTags, normalizeWeight } from './prompt';
import type { Tag } from '../types';

const tags: Tag[] = [
  { id: 'silver-hair', zh: '银发', en: 'silver hair', category: 'hair', aliases: ['银色头发'] },
  { id: 'blue-eyes', zh: '蓝眼睛', en: 'blue eyes', category: 'eyes', aliases: ['蓝瞳'] },
];

describe('Prompt 生成', () => {
  it('清理标签首尾空白', () => expect(normalizeTag('  silver hair \n')).toBe('silver hair'));
  it('过滤空条目并按首次出现的顺序去重', () => {
    expect(uniqueTags([' ', ' silver hair ', '', 'blue eyes', 'SILVER HAIR'])).toEqual(['silver hair', 'blue eyes']);
  });
  it('按所选顺序合并而非词典顺序，忽略未知 ID', () => {
    expect(buildPrompt(['blue-eyes', 'unknown', 'silver-hair', 'blue-eyes'], '', tags)).toBe('blue eyes, silver hair');
  });
  it('自定义标签支持逗号、中文逗号、换行并与内置标签去重', () => {
    expect(buildPrompt(['silver-hair'], ' ,blue eyes， silver hair\n watercolor, ', tags)).toBe('silver hair, blue eyes, watercolor');
  });
  it('空输入生成空字符串', () => expect(buildPrompt([], ' , \n， ', tags)).toBe(''));
});

describe('NovelAI V4+ 权重', () => {
  it('默认权重不改变现有输出', () => expect(buildPrompt(['silver-hair'], '', tags, { 'silver-hair': 1 })).toBe('silver hair'));
  it('增强与减弱逐个闭合，选择顺序不变', () => expect(buildPrompt(['silver-hair', 'blue-eyes'], 'clouds', tags, { 'silver-hair': 1.2, 'blue-eyes': 0.8 })).toBe('1.2::silver hair ::, 0.8::blue eyes ::, clouds'));
  it('零权重有效且不产生浮点尾数', () => expect(buildPrompt(['silver-hair', 'blue-eyes'], '', tags, { 'silver-hair': 0, 'blue-eyes': 1.2000000000000002 })).toBe('0::silver hair ::, 1.2::blue eyes ::'));
  it('自定义重复标签不会绕开已选标签的权重', () => expect(buildPrompt(['silver-hair', 'silver-hair'], 'SILVER HAIR, clouds', tags, { 'silver-hair': 1.3 })).toBe('1.3::silver hair ::, clouds'));
  it('无效或越界权重恢复默认值', () => expect([normalizeWeight(NaN), normalizeWeight(Infinity), normalizeWeight(-1), normalizeWeight(4)]).toEqual([1, 1, 1, 1]));
  it('真实表情标签按官方规则改名，加载失败回退也不注入混合分隔符', () => {
    expect(buildPrompt(['db:|_|', 'db::|', 'db:\\||/'], '', [], { 'db:|_|': 1.2 })).toBe('1.2::bar eyes ::, neutral face, open \\m/');
  });
  it('特殊表情中的下划线不变成空格', () => {
    expect(buildPrompt(['db:^_^', 'db:o_o'], '', [])).toBe('^_^, o_o');
  });
  it('未知控制符冲突不进入派生输出，自定义主动语法保留', () => {
    expect(buildPrompt(['db:00_qan[t]', 'db:haute_couture::le_noir', 'silver-hair'], '1.2::clouds ::', tags)).toBe('silver hair, 1.2::clouds ::');
  });
});

describe('中英文及别名搜索', () => {
  it('中文银发可以匹配', () => expect(matchesTag(tags[0], '银发')).toBe(true));
  it('英文忽略大小写与首尾空白', () => expect(matchesTag(tags[0], '  SILVER ')).toBe(true));
  it('别名支持部分匹配', () => expect(matchesTag(tags[0], '银色头')).toBe(true));
  it('不匹配的标签被排除', () => expect(matchesTag(tags[1], 'silver')).toBe(false));
});
