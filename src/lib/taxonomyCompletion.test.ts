import { expect, it } from 'vitest';
import type { Tag, TagCategory } from '../types';
import { taxonomyTrees } from '../data/tagTaxonomy';
import { getTagPaths, matchesTagPath } from './taxonomy';

const tag = (category: TagCategory, rawName: string): Tag => ({ id: rawName, rawName, en: rawName, zh: rawName, category });

it.each<[TagCategory, string, string[]]>([
  ['clothing', 'neck_ribbon', ['accessories', 'neck']],
  ['clothing', 'panties', ['fullbody', 'underwear']],
  ['clothing', 'maid_apron', ['upper', 'aprons']],
  ['clothing', 'japanese_clothes', ['fullbody', 'traditional']],
  ['clothing', 'alternate_costume', ['fullbody', 'costumes']],
  ['clothing', 'torn_clothes', ['details', 'state']],
  ['pose', 'paw_pose', ['hands']],
  ['pose', 'jojo_pose', ['body']],
  ['expression', ':d', ['happy']],
  ['expression', ':o', ['surprise']],
  ['expression', ':p', ['playful']],
  ['expression', 'expression_chart', ['charts']],
  ['character', 'no_humans', ['count']],
  ['hair', 'streaked_hair', ['color']],
  ['hair', 'hair_between_eyes', ['bangs']],
  ['hair', 'hair_rings', ['shape', 'buns']],
  ['hair', 'hair_tie', ['ornaments']],
  ['hair', 'straight_hair', ['shape', 'loose']],
  ['hair', 'hand_in_own_hair', ['actions']],
  ['hair', 'wet_hair', ['condition']],
  ['hair', 'facial_hair', ['bodyhair']],
  ['hair', 'hair_dryer', ['care']],
  ['hair', 'eyebrows_hidden_by_hair', ['bangs']],
  ['hair', 'multiple_hair_bows', ['ornaments']],
  ['hair', 'starry_hair', ['shape', 'fantasy']],
  ['eyes', 'mole_under_eye', ['details']],
  ['eyes', 'gradient_eyes', ['color']],
  ['eyes', 'ringed_eyes', ['shape']],
  ['eyes', 'one_eye_covered', ['state']],
  ['eyes', 'glowing_eyes', ['effects']],
  ['eyes', 'third_eye', ['number']],
  ['eyes', 'eye_mask', ['accessories']],
  ['eyes', 'eye_contact', ['actions']],
  ['eyes', 'crazy_eyes', ['state']],
  ['eyes', 'heart-shaped_eyes', ['shape']],
  ['scene', 'outdoors', ['nature']],
  ['lighting', 'ceiling_light', ['artificial']],
  ['lighting', 'light_particles', ['effects']],
  ['lighting', 'window_light', ['natural']],
  ['style', 'crayon_drawing', ['medium']],
  ['style', 'one-hour_drawing_challenge', ['practice']],
  ['style', 'drawing_tablet', ['tools']],
  ['meta', 'bad_pixiv_id', ['notes']],
  ['meta', 'photoshop_(medium)', ['format']],
  ['meta', 'jpeg_artifacts', ['quality']],
  ['meta', 'skeb_commission', ['origin']],
  ['meta', 'variant_set', ['editing']],
  ['meta', 'audible_music', ['audio']],
  ['meta', 'hard-translated', ['notes']],
  ['meta', 'live2d', ['format']],
  ['meta', 'key_visual', ['origin']],
  ['meta', 'noise_reduction', ['editing']],
  ['general', 'unlisted_dish_(food)', ['food']],
  ['general', 'kirin_(armor)', ['weapons', 'equipment']],
  ['general', 'stuffed_penguin', ['objects', 'toys']],
  ['general', 'canadian_flag', ['text', 'signs']],
  ['general', 'mosaic_censoring', ['composition', 'censoring']],
  ['general', 'headset', ['objects', 'electronics']],
  ['copyright', 'unknown_title_(webcomic)', ['manga']],
  ['copyright', 'unknown_title_(visual_novel)', ['games']],
  ['copyright', 'unknown_title_(song)', ['music']],
  ['copyright', 'unknown_title_(vocaloid)', ['music']],
  ['copyright', 'fire_emblem_fates', ['games']],
  ['copyright', 'persona_5', ['games']],
])('%s 的待细分词条 %s 可从已有或新增适用小类查找', (category, name, path) => {
  const paths = getTagPaths(tag(category, name));
  expect(paths).toContainEqual(path);
  expect(paths).not.toContainEqual(['other']);
  expect(matchesTagPath(paths, [path[0]])).toBe(true);
  let nodes = taxonomyTrees[category];
  for (const id of path) {
    const node = nodes?.find(item => item.id === id);
    expect(node, `${category}: ${path.join('/')}`).toBeDefined();
    nodes = node?.children;
  }
});

it('同形词和缺乏依据的专有名词继续待细分', () => {
  for (const [category, name] of [
    ['pose', 'log_pose'], ['lighting', 'light_machine_gun'], ['lighting', 'light_areolae'],
    ['lighting', 'light_of_foliar_incision_(genshin_impact)'], ['style', 'drawing_sword'],
    ['style', 'drawing_bow'], ['eyes', 'london_eye'], ['copyright', 'unknown_title_(movie)'],
    ['expression', 'anal_wink'], ['expression', 'cure_wink_(cosplay)'], ['expression', "today's_expression_(e.g.o)"],
    ['copyright', 'fire_emblem_unverified_fan_sequel'],
  ] as [TagCategory, string][]) expect(getTagPaths(tag(category, name)), name).toEqual([['other']]);
});

it('只补充待细分，已有多归属、其他通用限定与无分类大类保持原行为', () => {
  expect(getTagPaths(tag('clothing', 'white_shirt'))).toEqual([['upper', 'tops'], ['details', 'color']]);
  expect(getTagPaths(tag('general', 'rose_(street_fighter)_(cosplay)'))).toEqual([['themes', 'cosplay']]);
  expect(getTagPaths(tag('named-character', 'unknown_name'))).toEqual([['other']]);
  expect(getTagPaths(tag('artist', 'unknown_name'))).toEqual([['other']]);
  expect(getTagPaths({ ...tag('copyright', 'unverified_title'), zh: '动画漫画小说游戏' })).toEqual([['other']]);
});
