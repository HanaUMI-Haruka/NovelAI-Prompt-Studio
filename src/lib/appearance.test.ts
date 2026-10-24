import { expect, it } from 'vitest';
import { parseAppearance, readAppearance, saveAppearance } from './appearance';

it('首次使用采用明亮主题且不写入存储', () => {
  expect(parseAppearance(null)).toEqual({ theme: 'sky', error: null });
});
it.each(['sky', 'matcha', 'coral', 'ocean', 'violet'])('恢复用户已保存的主题：%s', theme => {
  expect(parseAppearance(JSON.stringify({ version: 1, theme }))).toEqual({ theme, error: null });
});
it.each(['broken', '{"version":2,"theme":"ocean"}', '{"version":1,"theme":"unknown"}', 'null'])('无效主题回退且明确反馈，不自动覆盖：%s', raw => {
  const result = parseAppearance(raw);
  expect(result.theme).toBe('sky');
  expect(result.error).toBeTruthy();
});
it('读取失败可回退使用，保留错误提示', () => {
  const result = readAppearance({ getItem: () => { throw new Error('Denied'); } });
  expect(result.theme).toBe('sky');
  expect(result.error).toBeTruthy();
});
it('主动选择写入主题自己的键，不触碰草稿或收藏', () => {
  const values = new Map([['ai-prompt-studio:draft', 'keep-draft'], ['ai-prompt-studio:library', 'keep-library']]);
  expect(saveAppearance('ocean', { setItem: (key, value) => { values.set(key, value); } })).toBeNull();
  expect(JSON.parse(values.get('ai-prompt-studio:appearance')!)).toEqual({ version: 1, theme: 'ocean' });
  expect(values.get('ai-prompt-studio:draft')).toBe('keep-draft');
  expect(values.get('ai-prompt-studio:library')).toBe('keep-library');
});
it('保存失败返回可显示错误，不让界面崩溃', () => {
  expect(saveAppearance('sky', { setItem: () => { throw new Error('Full'); } })).toBeTruthy();
});
