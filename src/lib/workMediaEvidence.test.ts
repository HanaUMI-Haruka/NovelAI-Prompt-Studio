import { expect, it } from 'vitest';
import { matchCanonicalAnimeTitles, mediaFromWikidataTypes, normalizeWorkTitle } from './workMediaEvidence';

const record = (title: string, sources = ['https://anilist.co/anime/1', 'https://myanimelist.net/anime/2'], type = 'TV') => ({ title, sources, type });
it('仅统一空格下划线大小写，保留影响身份的标点及限定', () => {
  expect(normalizeWorkTitle(' Girls Band Cry ')).toBe('girls_band_cry');
  expect(normalizeWorkTitle('Fate/Zero')).toBe('fate/zero');
  expect(normalizeWorkTitle('Gundam (Game)')).toBe('gundam_(game)');
});
it('标准标题需要精确对应，不用数据库别名或子串', () => {
  const matches = matchCanonicalAnimeTitles(['girls_band_cry', 'girls_band', 'sanrio', 'gundam_(game)'], [record('Girls Band Cry'), { ...record('Littleforestmello'), synonyms: ['Sanrio'] }, record('Gundam')]);
  expect([...matches.keys()]).toEqual(['girls_band_cry']);
});
it('同名作品、太短标题、未知类型和单一资料站留待核验', () => {
  const matches = matchCanonicalAnimeTitles(['same_title', 'air', 'unknown', 'single'], [record('Same Title'), record('Same Title'), record('Air'), record('Unknown', undefined, 'UNKNOWN'), record('Single', ['https://anilist.co/anime/1', 'https://anilist.co/anime/2'])]);
  expect(matches.size).toBe(0);
});
it('无效网址及任意域名不当成独立作品资料站', () => {
  expect(matchCanonicalAnimeTitles(['some_title'], [record('Some Title', ['broken', 'https://example.com/1', 'https://anilist.co/anime/1'])]).size).toBe(0);
});
it('Danbooru直接对应的具体类型可多归属，企划公司和普通影视类型不推测媒介', () => {
  expect(mediaFromWikidataTypes(['Q7889', 'Q21198342', 'Q7889'])).toEqual(['games', 'manga']);
  expect(mediaFromWikidataTypes(['Q196600', 'Q11424', 'Q4830453', 'Q5398426'])).toEqual([]);
  expect(mediaFromWikidataTypes(['Q210167', 'Q193564'])).toEqual([]);
});
