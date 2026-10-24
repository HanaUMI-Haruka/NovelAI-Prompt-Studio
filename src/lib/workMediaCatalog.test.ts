import { expect, it } from 'vitest';
import { getTagPaths } from './taxonomy';
import type { Tag } from '../types';

const work = (name: string): Tag => ({ id: name, rawName: name, en: name, zh: name, category: 'copyright' });
it.each([
  ['omori', 'games'], ['fate/extra', 'games'], ['overwatch', 'games'], ['fire_emblem_awakening', 'games'],
  ['pokemon_bw', 'games'], ['pokemon_xy', 'games'], ['gundam_arsenal_base', 'games'],
  ['dungeon_meshi', 'manga'], ['dungeon_meshi', 'anime'], ['gundam_suisei_no_majo', 'anime'],
  ['girls_band_cry', 'anime'], ['fate/apocrypha', 'novels'], ['mushoku_tensei', 'novels'],
  ['hololive_dev_is', 'virtual'], ['pokemon_adventures', 'manga'], ['pokemon_horizons', 'anime'],
  ['link!_like!_love_live!', 'games'], ['touken_ranbu', 'games'], ['touken_ranbu', 'anime'],
  ['sonic_(series)', 'games'], ['the_king_of_fighters', 'games'], ['code_geass', 'anime'],
  ['magia_record:_mahou_shoujo_madoka_magica_gaiden', 'games'], ['aikatsu!_(series)', 'anime'],
  ['voicevox', 'virtual'], ['kamen_rider', 'live'], ['hollow_knight', 'games'],
  ['lord_of_the_mysteries', 'novels'], ['modao_zushi', 'anime'],
])('核对后的作品 %s 可在 %s 中查找', (name, media) => expect(getTagPaths(work(name))).toContainEqual([media]));

it('具体游戏简称和衍生作品按各自媒介处理，未知续作不自动继承', () => {
  expect(getTagPaths(work('pokemon_xy'))).not.toContainEqual(['anime']);
  expect(getTagPaths(work('gundam_arsenal_base'))).not.toContainEqual(['anime']);
  expect(getTagPaths(work('gundam_seed_astray'))).not.toContainEqual(['anime']);
  expect(getTagPaths(work('pokemon_unverified_fan_sequel'))).toEqual([['other']]);
  expect(getTagPaths(work('gundam_unverified_fan_sequel'))).toEqual([['other']]);
  expect(getTagPaths(work('unlisted_title_(movie)'))).toEqual([['other']]);
});

it('公司的别名、现实概念和中文提示不能作为动画或游戏依据', () => {
  expect(getTagPaths(work('sanrio'))).toEqual([['other']]);
  expect(getTagPaths(work("mcdonald's"))).toEqual([['other']]);
  expect(getTagPaths(work('real_life'))).toEqual([['other']]);
  expect(getTagPaths({ ...work('unlisted_unknown_title'), zh: '动画游戏漫画小说大作' })).toEqual([['other']]);
});
