import type { Tag } from '../types';
import { taxonomyRules } from '../data/tagTaxonomy';
import { taxonomyCompletionRules } from '../data/taxonomyCompletion';
import { workMedia } from '../data/workMedia';
import { sortTags } from './tagSorting';

const OTHER = [['other']];
const countFormat = new Intl.NumberFormat('en-US');
const MEDIA_QUALIFIERS: Record<string, string> = { anime: 'anime', animation: 'anime', cartoon: 'anime', ova: 'anime', donghua: 'anime', manga: 'manga', manhwa: 'manga', manhua: 'manga', comic: 'manga', comics: 'manga', webcomic: 'manga', webtoon: 'manga', game: 'games', video_game: 'games', visual_novel: 'games', fangame: 'games', novel: 'novels', light_novel: 'novels', web_novel: 'novels', live_action: 'live', song: 'music', album: 'music', music_video: 'music', vocaloid: 'music', utau: 'music', synthesizer_v: 'music', cevio: 'music', vtuber: 'virtual' };
const GENERAL_THEME_QUALIFIERS: Record<string, string> = { cosplay: 'cosplay', meme: 'parody', style: 'render' };
const sourceName = (tag: Tag) => (tag.rawName ?? tag.en).toLowerCase().replaceAll(' ', '_');

export function getTagPaths(tag: Tag): string[][] {
  const name = sourceName(tag);
  if (tag.category === 'general') {
    // 角色名或画师名可能含 rose、cat 等普通单词，明确主题限定优先，避免按名字误分。
    const theme = name.match(/_\((cosplay|meme|style)\)$/)?.[1];
    if (theme) return [['themes', GENERAL_THEME_QUALIFIERS[theme]]];
  }
  if (tag.category === 'copyright') {
    // 只把明确媒介限定当作类型；不由中文译名或系列前缀推断。
    const explicit = name.match(/_\(([^()]+)\)$/)?.[1];
    if (explicit && Object.hasOwn(MEDIA_QUALIFIERS, explicit)) return [[MEDIA_QUALIFIERS[explicit]]];
    return Object.hasOwn(workMedia, name) ? workMedia[name].map(media => [media]) : OTHER;
  }
  const matches = taxonomyRules[tag.category]?.filter(rule => rule.pattern.test(name) && !rule.exclude?.test(name)).map(rule => rule.path) ?? [];
  if (matches.length) return matches;
  const completed = taxonomyCompletionRules[tag.category]?.filter(rule => rule.pattern.test(name) && !rule.exclude?.test(name)).map(rule => rule.path) ?? [];
  return completed.length ? [...new Map(completed.map(path => [path.join('/'), path])).values()] : OTHER;
}

export function matchesTagPath(paths: string[][], selected: string[]): boolean {
  return !selected.length || paths.some(path => selected.every((id, index) => path[index] === id));
}

const validCount = (count: number | undefined) => typeof count === 'number' && Number.isFinite(count) && count >= 0 ? count : -1;
export function sortTagsByUsage(tags: Tag[]): Tag[] {
  return sortTags(tags, 'usage', 'desc');
}
export function formatPostCount(count: number | undefined): string {
  return validCount(count) < 0 ? '暂无引用数据' : `${countFormat.format(count!)} 次引用`;
}
