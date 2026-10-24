import { expect, it } from 'vitest';
import { decodeCatalog } from './catalog';
import { buildPrompt } from './prompt';

it('保留原内置ID和别名，同词条只出现一次，新角色保留原名及分类', () => {
  const tags = decodeCatalog([['blue_eyes', '蓝色眼睛', 0, 100, 'eyes'], ['hatsune_miku', '初音未来', 4, 90, 'named-character']]);
  expect(tags.filter(tag => tag.en === 'blue eyes')).toHaveLength(1);
  expect(tags.find(tag => tag.en === 'blue eyes')?.id).toBe('blue-eyes');
  expect(tags.find(tag => tag.id === 'db:hatsune_miku')).toMatchObject({ zh: '初音未来', en: 'hatsune miku', category: 'named-character', rawName: 'hatsune_miku' });
});
it('拒绝损坏或未知分类的快照', () => {
  expect(() => decodeCatalog([['test', '测试', 4, 1, 'invalid']])).toThrow();
  expect(() => decodeCatalog({ error: 'not data' })).toThrow();
});
it('词典加载失败时已存标签仍可输出并调权', () => {
  expect(buildPrompt(['db:hatsune_miku'], '', [], { 'db:hatsune_miku': 1.2 })).toBe('1.2::hatsune miku ::');
});
it('词典解码后统一按引用数量排序，基础无统计标签仍置后', () => {
  const tags = decodeCatalog([['low_example', '低频', 0, 10, 'general'], ['high_example', '高频', 0, 100, 'general']]);
  expect(tags.slice(0, 2).map(tag => tag.rawName)).toEqual(['high_example', 'low_example']);
  expect(tags.at(-1)?.postCount).toBeUndefined();
});
