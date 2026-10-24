// 维护脚本使用；网页只读取生成后的精确映射，不在交互时匹配外部数据库。
export type WorkMedium = 'games' | 'anime' | 'manga' | 'novels' | 'virtual' | 'music' | 'live';
export type AnimeTitleRecord = { title: string; sources: string[]; type: string; synonyms?: string[] };
export const normalizeWorkTitle = (name: string) => name.normalize('NFKC').trim().toLowerCase().replace(/[\s_]+/g, '_');

const providers = new Set(['anidb.net', 'anilist.co', 'myanimelist.net', 'kitsu.app', 'livechart.me', 'anime-planet.com', 'anisearch.com', 'animenewsnetwork.com', 'simkl.com', 'animecountdown.com']);
const animeTypes = new Set(['TV', 'MOVIE', 'OVA', 'ONA', 'SPECIAL']);

export function matchCanonicalAnimeTitles(names: string[], records: AnimeTitleRecord[]): Map<string, AnimeTitleRecord> {
  const index = new Map<string, AnimeTitleRecord[]>();
  for (const record of records) {
    if (!animeTypes.has(record.type)) continue;
    const hosts = new Set(record.sources.flatMap(source => {
      try { const host = new URL(source).hostname.replace(/^www\./, ''); return providers.has(host) ? [host] : []; }
      catch { return []; }
    }));
    if (hosts.size < 2) continue;
    const key = normalizeWorkTitle(record.title);
    index.set(key, [...(index.get(key) ?? []), record]);
  }
  const result = new Map<string, AnimeTitleRecord>();
  for (const name of names) {
    const key = normalizeWorkTitle(name);
    const matches = index.get(key);
    // 不用简称、别名、中文译名、模糊子串或去掉限定词来猜测作品。
    if (key.length >= 5 && matches?.length === 1) result.set(name, matches[0]);
  }
  return result;
}

const typeGroups: [WorkMedium, string[]][] = [
  ['games', ['Q7889', 'Q7058673', 'Q5383567', 'Q64170203', 'Q116774927', 'Q116774997', 'Q116809654', 'Q117051105', 'Q116779426', 'Q734698', 'Q15804899', 'Q819122', 'Q1643932', 'Q141546978']],
  ['anime', ['Q63952888', 'Q202866', 'Q20650540', 'Q117467246', 'Q117467240', 'Q113687694', 'Q220898', 'Q1047299', 'Q113791292']],
  ['manga', ['Q21198342', 'Q865484', 'Q213369', 'Q21202185', 'Q8274', 'Q1004', 'Q14406742', 'Q1760610', 'Q21190961']],
  ['novels', ['Q104213567', 'Q1667921']],
  ['virtual', ['Q126480223', 'Q138304223']],
  ['music', ['Q2088357', 'Q11664239']],
];
const typeMedia = new Map(typeGroups.flatMap(([media, ids]) => ids.map(id => [id, media] as const)));

export function mediaFromWikidataTypes(ids: string[]): WorkMedium[] {
  return [...new Set(ids.flatMap(id => { const media = typeMedia.get(id); return media ? [media] : []; }))];
}
