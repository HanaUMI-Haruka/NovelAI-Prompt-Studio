import { expect, it } from 'vitest';
import { parseSortSettings, saveSortSettings } from './sortPreferences';

it('恢复旧版默认引用降序及关闭已选优先', () => {
  expect(parseSortSettings(null)).toEqual({ settings: { key: 'usage', direction: 'desc', selectedFirst: false }, error: null });
});
it('读取三种简单排序设置并保留方向和已选优先', () => {
  for (const key of ['usage', 'pinyin', 'english']) {
    const settings = { key, direction: 'asc', selectedFirst: true };
    expect(parseSortSettings(JSON.stringify({ version: 1, settings }))).toEqual({ settings, error: null });
  }
});
it('兼容此前智能版本中三种对应排序，其他模式恢复引用降序', () => {
  for (const [mode, key] of [['usage', 'usage'], ['zh_pinyin', 'pinyin'], ['english', 'english'], ['smart_az', 'usage'], ['ja_gojuon', 'usage'], ['by_work', 'usage'], ['source_order', 'usage']]) {
    const result = parseSortSettings(JSON.stringify({ version: 1, settings: { profile: { mode, direction: 'asc' }, selectedFirst: true } }));
    expect(result).toEqual({ settings: { key, direction: ['usage', 'zh_pinyin', 'english'].includes(mode) ? 'asc' : 'desc', selectedFirst: true }, error: null });
  }
});
it('损坏或未来设置回退简单排序并提示，不执行自动写入', () => {
  for (const raw of ['{broken', JSON.stringify({ version: 99 }), JSON.stringify({ version: 1, settings: { key: 'smart_az', direction: 'asc', selectedFirst: false } })]) {
    expect(parseSortSettings(raw).settings.key).toBe('usage');
    expect(parseSortSettings(raw).error).toBeTruthy();
  }
});
it('仅写入简单配置，写入失败返回可重试提示', () => {
  const settings = { key: 'pinyin' as const, direction: 'desc' as const, selectedFirst: true };
  let saved = '';
  expect(saveSortSettings(settings, { setItem: (_key, value) => { saved = value; } })).toBeNull();
  expect(parseSortSettings(saved).settings).toEqual(settings);
  expect(saved).not.toContain('profile');
  expect(saveSortSettings(settings, { setItem: () => { throw new Error('full'); } })).toMatch(/未保存/);
});
it('撤回罗马音后安全使用英文排序，保留方向与已选优先', () => {
  for (const direction of ['asc', 'desc']) {
    const raw = JSON.stringify({ version: 1, settings: { key: 'romaji', direction, selectedFirst: true } });
    expect(parseSortSettings(raw)).toEqual({ settings: { key: 'english', direction, selectedFirst: true }, error: null });
  }
});
