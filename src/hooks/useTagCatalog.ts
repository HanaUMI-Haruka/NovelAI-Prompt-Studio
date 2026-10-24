import { useEffect, useMemo, useState } from 'react';
import { categories, sampleTags } from '../data/sampleTags';
import { decodeCatalog } from '../lib/catalog';
import { getTagPaths, sortTagsByUsage } from '../lib/taxonomy';
import type { Tag, TagCategory } from '../types';
import { decodeCatalogSortIndex, getCatalogFingerprint } from '../lib/catalogSortIndex';
import type { CatalogSortIndex } from '../lib/catalogSortIndex';
import { applyPersonalTags, personalTagToTag } from '../lib/personalTags';
import type { PersonalPreferences } from '../lib/personalTags';
import { buildPersonalSortOverlay } from '../lib/personalSortOverlay';

export function useTagCatalog(personal: PersonalPreferences) {
  const [baseTags, setTags] = useState<Tag[]>(() => sortTagsByUsage(sampleTags.map(tag => ({ ...tag, subcategoryPaths: getTagPaths(tag) }))));
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [sortIndex, setSortIndex] = useState<CatalogSortIndex | null>(null);
  const [sortIndexError, setSortIndexError] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch(`${import.meta.env.BASE_URL}catalog/manifest.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('metadata'); return response.json(); })
      .then((data: unknown) => {
        const value = data && typeof data === 'object' && 'committedAt' in data ? data.committedAt : null;
        if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error('date');
        if (!controller.signal.aborted) setSnapshotDate(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value)));
      }).catch(() => { if (!controller.signal.aborted) setSnapshotDate(null); });
    const indexBytes = fetch(`${import.meta.env.BASE_URL}catalog/simple-sort-v1.bin`, { signal: controller.signal })
      .then(response => response.ok ? response.arrayBuffer() : null).catch(() => null);
    fetch(`${import.meta.env.BASE_URL}catalog/danbooru-tags.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
      .then(async data => {
        if (controller.signal.aborted) return;
        const loaded = decodeCatalog(data);
        let index: CatalogSortIndex | null = null;
        try {
          const bytes = await indexBytes;
          if (!bytes) throw new Error('missing sort resource');
          index = decodeCatalogSortIndex(bytes, loaded.length, await getCatalogFingerprint(loaded));
        } catch { /* 资源缺失或与词库不匹配时保留原有普通排序，不使用错误顺序。 */ }
        if (!controller.signal.aborted) {
          setTags(loaded); setSortIndex(index);
          setSortIndexError(index ? null : '快速切换资源未就绪，暂用普通排序，切换较大词库时可能稍慢。');
          setStatus('ready');
        }
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt]);
  const applied = useMemo(() => applyPersonalTags(baseTags, personal), [baseTags, personal]);
  const tags = applied.tags;
  const sortOverlay = useMemo(() => buildPersonalSortOverlay(baseTags, tags, applied.changedPositions), [baseTags, tags, applied]);
  const baseById = useMemo(() => new Map(baseTags.map(tag => [tag.id, tag])), [baseTags]);
  const counts = useMemo(() => {
    const result = Object.fromEntries(categories.map(category => [category.id, 0])) as Record<TagCategory, number>;
    for (const tag of tags) result[tag.category]++;
    return result;
  }, [tags]);
  const byId = useMemo(() => {
    if (tags === baseTags && !personal.tags.length) return baseById;
    const result = new Map(baseById);
    for (const position of applied.changedPositions) result.set(tags[position].id, tags[position]);
    for (const tag of personal.tags) if (tag.archived) result.set(tag.id, personalTagToTag(tag));
    return result;
  }, [baseById, baseTags, tags, applied, personal.tags]);
  return { tags, counts, byId, baseById, sortOverlay, status, snapshotDate, sortIndex, sortIndexError, retry: () => setAttempt(value => value + 1) };
}
