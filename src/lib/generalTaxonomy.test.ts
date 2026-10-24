import { expect, it } from 'vitest';
import type { Tag } from '../types';
import { taxonomyTrees } from '../data/tagTaxonomy';
import { decodeCatalog } from './catalog';
import { getTagPaths, matchesTagPath } from './taxonomy';

const tag = (rawName: string): Tag => ({ id: rawName, rawName, en: rawName, zh: '测试译名', category: 'general' });

it.each([
  ['身体部位', 'body/face', 'sharp_teeth', 'parted_lips'],
  ['体型肤色', 'appearance/skin', 'dark-skinned_female', 'tanlines'],
  ['服装配饰', 'clothing/accessories', 'red_bow', 'earrings'],
  ['动物生物', 'animals/aquatic', 'goldfish', 'jellyfish'],
  ['植物花卉', 'plants/flowers', 'rose', 'cherry_blossoms'],
  ['日常道具', 'objects/electronics', 'cellphone', 'headphones'],
  ['食品饮料', 'food/drinks', 'coffee', 'bubble_tea'],
  ['武器装备', 'weapons/melee', 'katana', 'sword'],
  ['交通工具', 'vehicles/air', 'airplane', 'helicopter'],
  ['画面构图', 'composition/viewpoint', 'from_side', 'pov'],
  ['动作关系', 'interaction/relationships', 'siblings', 'couple'],
  ['文字标注', 'text/language', 'english_text', 'japanese_text'],
  ['视觉效果', 'effects/motion', 'motion_lines', 'afterimage'],
  ['裸露成人', 'mature/nudity', 'completely_nude', 'topless'],
  ['角色创作主题', 'themes/cosplay', 'keqing_(genshin_impact)_(cosplay)', 'cosplay'],
  ['自然环境', 'environment/sky', 'full_moon', 'star_(sky)'],
  ['表情细节', 'expression/emotion', 'happy', 'smug'],
])('%s可按父级和具体小类筛选', (_label, path, first, second) => {
  for (const name of [first, second]) {
    const paths = getTagPaths(tag(name));
    expect(paths).toContainEqual(path.split('/'));
    expect(matchesTagPath(paths, [path.split('/')[0]])).toBe(true);
    expect(paths).not.toContainEqual(['other']);
  }
});

it('兽耳、动物纹样和热狗不被误归为实际动物', () => {
  for (const name of ['cat_ears', 'cat_print', 'butterfly_bow', 'hot_dog']) {
    expect(getTagPaths(tag(name)).some(path => path[0] === 'animals')).toBe(false);
  }
  expect(getTagPaths(tag('cat_ears'))).toContainEqual(['body', 'fantasy']);
  expect(getTagPaths(tag('hot_dog'))).toContainEqual(['food', 'prepared']);
});

it('词边界与限定区分歧义词和子串', () => {
  expect(getTagPaths(tag('bass_guitar'))).toContainEqual(['objects', 'music']);
  expect(getTagPaths(tag('bass_guitar'))).not.toContainEqual(['animals', 'aquatic']);
  expect(getTagPaths(tag('bow_(weapon)'))).toContainEqual(['weapons', 'ranged']);
  expect(getTagPaths(tag('bow_(weapon)'))).not.toContainEqual(['clothing', 'accessories']);
  expect(getTagPaths(tag('breastplate'))).not.toContainEqual(['body', 'torso']);
  expect(getTagPaths(tag('gunship'))).not.toContainEqual(['weapons', 'ranged']);
});

it('背心不是坦克，球棒和毛绒玩具不是实际动物', () => {
  expect(getTagPaths(tag('black_tank_top'))).not.toContainEqual(['vehicles', 'land']);
  expect(getTagPaths(tag('black_tank_top'))).toContainEqual(['clothing', 'upper']);
  for (const name of ['baseball_bat', 'stuffed_animal', 'teddy_bear', 'dog_tags', 'playboy_bunny']) {
    expect(getTagPaths(tag(name)).some(path => path[0] === 'animals')).toBe(false);
  }
  expect(getTagPaths(tag('teddy_bear'))).toContainEqual(['objects', 'toys']);
});

it('明确限定词与符号表情可以分类，引用作品名字不凭空推断', () => {
  expect(getTagPaths(tag('unlisted_name_(flower)'))).toContainEqual(['plants', 'flowers']);
  expect(getTagPaths(tag('unlisted_name_(meme)'))).toContainEqual(['themes', 'parody']);
  expect(getTagPaths(tag('unlisted_name_(style)'))).toContainEqual(['themes', 'render']);
  expect(getTagPaths(tag('^_^'))).toContainEqual(['expression', 'emoticons']);
  expect(getTagPaths(tag('unlisted_name_(game)'))).toEqual([['other']]);
  expect(getTagPaths(tag('rose_(street_fighter)_(cosplay)'))).toEqual([['themes', 'cosplay']]);
  expect(getTagPaths(tag('cat_(meme)'))).toEqual([['themes', 'parody']]);
  expect(getTagPaths(tag('fish_(style)'))).toEqual([['themes', 'render']]);
});

it('多归属保留，无法判断时不由中文译名猜测', () => {
  const paths = getTagPaths(tag('holding_sword'));
  expect(paths).toContainEqual(['weapons', 'melee']);
  expect(paths).toContainEqual(['interaction', 'actions']);
  expect(getTagPaths({ ...tag('unlisted_ambiguous_tag'), zh: '花朵手机猫咪' })).toEqual([['other']]);
});

it('原始名字、空格英文回退和其他大类彼此独立', () => {
  expect(getTagPaths({ ...tag('ignored'), rawName: undefined, en: 'bubble tea' })).toContainEqual(['food', 'drinks']);
  expect(getTagPaths({ ...tag('red_bow'), category: 'copyright' })).toEqual([['other']]);
  expect(getTagPaths({ ...tag('silver_hair'), category: 'hair' })).toContainEqual(['color']);
});

it('词库解码保留ID、原文和引用数据并准备新路径', () => {
  const result = decodeCatalog([['cellphone', '手机', 0, 138267, 'general']]);
  const phone = result.find(item => item.rawName === 'cellphone')!;
  expect(phone.id).toBe('db:cellphone');
  expect(phone.zh).toBe('手机');
  expect(phone.postCount).toBe(138267);
  expect(phone.subcategoryPaths).toContainEqual(['objects', 'electronics']);
});

it('常见词条的分类路径在导航树中均可访问', () => {
  for (const name of ['cat_ears', 'breasts', 'tattoo', 'thighhighs', 'dog', 'rose', 'cellphone', 'coffee', 'sword', 'airplane', 'full_body', 'hug', 'english_text', 'sparkle', 'nude']) {
    for (const path of getTagPaths(tag(name))) {
      let nodes = taxonomyTrees.general;
      for (const id of path) {
        const node = nodes?.find(item => item.id === id);
        expect(node, `${name}: ${path.join('/')}`).toBeDefined();
        nodes = node?.children;
      }
      expect(path).not.toEqual(['other']);
    }
  }
});
