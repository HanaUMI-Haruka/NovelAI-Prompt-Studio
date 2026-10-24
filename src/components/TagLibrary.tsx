import { ArrowDownWideNarrow, ArrowUpNarrowWide, BookUser, Check, Command, Grid2X2, LoaderCircle, Search, SearchX, Sparkles, Star, X } from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { categories } from '../data/sampleTags';
import { CategoryIcon } from './CategoryIcon';
import { matchesTag } from '../lib/prompt';
import type { LibraryScope, Tag, TagCategory } from '../types';
import { getTagPaths, matchesTagPath } from '../lib/taxonomy';
import { SubcategoryFilter } from './SubcategoryFilter';
import { getTagSortLabel, prioritizeSelectedTags, sortTags } from '../lib/tagSorting';
import type { TagSortKey } from '../lib/tagSorting';
import type { SortSettings } from '../lib/sortPreferences';
import type { SortController } from '../hooks/useSortPreferences';
import type { LibraryController } from '../hooks/useLibraryPreferences';
import type { PromptChunk } from '../lib/promptChunks';
import { PromptChunkList } from './PromptChunkList';
import { getFavoriteTagIds, matchesUsageThreshold, resolveFavoriteFolderId } from '../lib/libraryPreferences';
import { UsageFilter } from './UsageFilter';
import { FavoriteFolders } from './FavoriteFolders';
import { FavoriteTagDialog } from './FavoriteTagDialog';
import { LibraryDialog } from './LibraryDialog';
import { TagCard } from './TagCard';
import { getPersonalizedTagPage } from '../lib/personalSortOverlay';
import type { PersonalSortOverlay } from '../lib/personalSortOverlay';
import type { CatalogSortIndex } from '../lib/catalogSortIndex';
import { TagPagination } from './TagPagination';
import { PersonalTagLibrary } from './PersonalTagLibrary';

const EMPTY_PATH: string[] = [];
type Props = { category: TagCategory | 'all'; onCategory: (value: TagCategory | 'all') => void; selectedIds: string[]; onToggle: (id: string) => void; tags: Tag[]; byId: ReadonlyMap<string, Tag>; savedLibrary: LibraryController; onUseChunk: (chunk: PromptChunk) => void; status: 'loading' | 'ready' | 'error'; onRetry: () => void; snapshotDate: string | null; scope: LibraryScope; onScope: (value: LibraryScope) => void; sortIndex: CatalogSortIndex | null; sortIndexError: string | null; sort: SortController; sortOverlay: PersonalSortOverlay | null; personalTags: Tag[]; onCreatePersonal: () => void; onPersonal: () => void; onEditTag: (tag: Tag) => void };

export function TagLibrary({ category, onCategory, selectedIds, onToggle, tags, byId, savedLibrary, onUseChunk, status, onRetry, snapshotDate, scope, onScope, sortIndex, sortIndexError, sort, sortOverlay, personalTags, onCreatePersonal, onPersonal, onEditTag }: Props) {
  const favoritesOnly = scope === 'favorites', personalOnly = scope === 'personal';
  const { preferences, blocked, error } = savedLibrary;
  const [requestedFolderId, setFolderId] = useState('all');
  const folderId = resolveFavoriteFolderId(preferences.folders, requestedFolderId);
  useEffect(() => { if (folderId !== requestedFolderId) setFolderId(folderId); }, [folderId, requestedFolderId]);
  const [favoriteTag, setFavoriteTag] = useState<Tag | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const favoriteIds = useMemo(() => getFavoriteTagIds(preferences.folders, 'all'), [preferences.folders]);
  const chunkCount = preferences.folders.reduce((total, folder) => total + folder.chunks.length, 0);
  const scopeIds = useMemo(() => folderId === 'all' ? favoriteIds : getFavoriteTagIds(preferences.folders, folderId), [preferences.folders, folderId, favoriteIds]);
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [page, setPage] = useState(1);
  const sortSettings = sort.settings;
  const sortError = sort.error;
  const sortKey = sortSettings.key;
  const direction = sortSettings.direction;
  const selectedFirst = sortSettings.selectedFirst;
  const DirectionIcon = direction === 'desc' ? ArrowDownWideNarrow : ArrowUpNarrowWide;
  function changeSort(value: SortSettings) { sort.change(value); setPage(1); }
  const [selection, setSelection] = useState<{ category: TagCategory | 'all'; path: string[] }>({ category, path: [] });
  const path = selection.category === category ? selection.path : EMPTY_PATH;
  useEffect(() => setSelection({ category, path: [] }), [category]);
  useEffect(() => { setQuery(''); setSelection({ category, path: [] }); setPage(1); }, [scope]);
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handle = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && searchRef.current?.getClientRects().length) { event.preventDefault(); searchRef.current.focus(); } };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, []);
  const searching = Boolean(deferredQuery.trim());
  const scopeTags = useMemo(() => personalOnly ? [] : favoritesOnly ? tags.filter(tag => scopeIds.has(tag.id)) : tags, [tags, favoritesOnly, personalOnly, scopeIds]);
  const eligibleTags = useMemo(() => scopeTags.filter(tag => matchesUsageThreshold(tag, preferences.usage)), [scopeTags, preferences.usage]);
  const categoryTags = useMemo(() => category === 'all' ? eligibleTags : eligibleTags.filter(tag => category === tag.category), [eligibleTags, category]);
  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase().replaceAll('_', ' ');
    return categoryTags.filter(tag => (!path.length || matchesTagPath(tag.subcategoryPaths ?? getTagPaths(tag), path)) && (!normalized || (tag.searchText ? tag.searchText.includes(normalized) : matchesTag(tag, normalized))));
  }, [categoryTags, deferredQuery, path]);
  const scopeForSorting = useMemo(() => filtered.length === tags.length ? null : new Set(filtered.map(tag => tag.id)), [filtered, tags]);
  const ordered = useMemo(() => sortIndex ? [] : sortTags(filtered, sortKey, direction), [sortIndex, filtered, sortKey, direction]);
  const selectedForSorting = selectedFirst ? selectedIds : EMPTY_PATH;
  const displayed = useMemo(() => selectedFirst ? prioritizeSelectedTags(ordered, selectedForSorting, sortKey) : ordered, [ordered, selectedFirst, selectedForSorting, sortKey]);
  useEffect(() => setPage(1), [deferredQuery, category, path, sortKey, direction, selectedFirst, preferences.usage, folderId, favoritesOnly]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 60));
  const currentPage = Math.min(page, pageCount);
  const visibleTags = useMemo(() => personalOnly ? [] : sortIndex
    ? getPersonalizedTagPage(tags, sortIndex, scopeForSorting, sortKey, direction, currentPage, 60, selectedForSorting, sortOverlay)
    : displayed.slice((currentPage - 1) * 60, currentPage * 60), [tags, sortIndex, scopeForSorting, sortKey, direction, currentPage, selectedForSorting, displayed, sortOverlay, personalOnly]);
  const currentCategory = categories.find(item => item.id === category);
  const changeFolder = (id: string) => { setFolderId(id); setQuery(''); onCategory('all'); setSelection({ category: 'all', path: [] }); setPage(1); };

  return <section className="library" aria-labelledby="library-title">
    <div className="library-heading"><div className="eyebrow"><span /> YOUR CREATIVE TOOLKIT</div><h1 id="library-title">每一个标签，都是灵感的起点<span>。</span></h1><p>用中文发现标签，将脑海中的画面变成英文 Prompt。</p></div>
    {!personalOnly && <><div className="intro-banner"><div className="intro-symbol"><Sparkles size={27} strokeWidth={1.4} /></div><div><strong>Danbooru 标签库 · 为 NovelAI 整理</strong><p>按角色、作品与画面元素查找，在右侧调节每个标签的权重。</p></div><span className="intro-decoration" aria-hidden="true">✧</span></div>
    <div className={`catalog-status ${status}`} role="status">{status === 'loading' ? <><LoaderCircle size={14} className="loading-spin" />正在读取本地标签库，当前可使用基础标签…</> : status === 'error' ? <>标签库加载失败，已保留基础标签及当前草稿。<button onClick={onRetry}>重新加载</button></> : <><Check size={14} />本地词库已就绪 · {tags.length.toLocaleString()} 个标签</>}</div></>}
    {error && <div className="library-storage-alert" role="alert"><p>{error}{blocked && ' 原数据未被覆盖。重置前暂停修改收藏与筛选，Prompt 编辑仍可使用。'}</p>{blocked ? <><button onClick={savedLibrary.reload}>重新读取收藏与筛选</button><button onClick={() => setResetOpen(true)}>重置收藏与筛选</button></> : <button onClick={savedLibrary.retry}>重试保存收藏与筛选</button>}</div>}
    <nav className="library-scope" aria-label="标签库范围"><button className={scope === 'all' ? 'active' : ''} aria-pressed={scope === 'all'} onClick={() => onScope('all')}><Grid2X2 size={15} />标签库</button><button className={favoritesOnly ? 'active' : ''} aria-pressed={favoritesOnly} onClick={() => onScope('favorites')}><Star size={15} />我的收藏<span>{favoriteIds.size.toLocaleString()} 标签{chunkCount > 0 && ` · ${chunkCount.toLocaleString()} 组合`}</span></button><button className={`personal-library-entry ${personalOnly ? 'active' : ''}`} aria-pressed={personalOnly} onClick={() => onScope('personal')}><BookUser size={15} />个人标签库<span>{personalTags.length} 标签</span></button></nav>
    {personalOnly ? <PersonalTagLibrary tags={personalTags} selectedIds={selectedIds} favoriteIds={favoriteIds} favoritesBlocked={blocked} onToggle={onToggle} onFavorite={setFavoriteTag} onEdit={onEditTag} onCreate={onCreatePersonal} onManage={onPersonal} /> : <>
    {favoritesOnly && <FavoriteFolders folders={preferences.folders} current={folderId} onCurrent={changeFolder} onCreate={savedLibrary.createFolder} onRename={savedLibrary.renameFolder} onDelete={savedLibrary.deleteFolder} disabled={blocked} />}
    {favoritesOnly && <PromptChunkList folders={preferences.folders} current={folderId} byId={byId} onUse={onUseChunk} onRename={savedLibrary.renameChunk} onDelete={savedLibrary.deleteChunk} disabled={blocked} />}
    <div className="search-box"><Search size={19} /><input ref={searchRef} aria-label="搜索标签" placeholder="搜索中文、英文或别名，例如：银发 / silver" value={query} onChange={event => setQuery(event.target.value)} />{query ? <button aria-label="清除搜索" onClick={() => { setQuery(''); searchRef.current?.focus(); }}><X size={16} /></button> : <kbd><Command size={12} /> K</kbd>}</div>
    <div className="category-pills" aria-label="快速切换分类"><button className={category === 'all' ? 'selected' : ''} aria-pressed={category === 'all'} onClick={() => onCategory('all')}><Grid2X2 size={14} strokeWidth={1.8} aria-hidden="true" />全部</button>{categories.map(item => <button key={item.id} className={category === item.id ? 'selected' : ''} aria-pressed={category === item.id} onClick={() => onCategory(item.id)}><CategoryIcon category={item.id} size={15} />{item.name.split(' / ')[0]}</button>)}</div>
    <SubcategoryFilter category={category} categoryName={currentCategory?.name ?? '全部'} tags={categoryTags} path={path} onPath={next => { setSelection({ category, path: next }); setPage(1); }} />
    <UsageFilter usage={preferences.usage} disabled={blocked} onChange={savedLibrary.setUsage} />
    <div className="sort-toolbar" role="group" aria-label="标签排序">
      <label className="sort-field"><span>排序方式</span><select aria-label="标签排序方式" value={sortKey} onChange={event => { const key = event.target.value as TagSortKey; changeSort({ ...sortSettings, key, direction: key === 'usage' ? 'desc' : 'asc' }); }}><option value="usage">引用次数</option><option value="pinyin">汉语拼音</option><option value="english">英语字母</option></select></label>
      <button className="sort-direction" aria-label={`${getTagSortLabel(sortKey, direction)}，点击反转排序`} onClick={() => changeSort({ ...sortSettings, direction: direction === 'asc' ? 'desc' : 'asc' })}><DirectionIcon size={15} />{getTagSortLabel(sortKey, direction)}</button>
      <label className="selected-first-control"><input type="checkbox" checked={selectedFirst} onChange={event => changeSort({ ...sortSettings, selectedFirst: event.target.checked })} />已选标签优先</label>
    </div>
    {sortError && <div className="sort-preference-error" role="alert">{sortError}<button onClick={sort.retry}>重试保存排序配置</button></div>}
    {sortIndexError && <div className="sort-preference-error" role="alert">{sortIndexError}<button onClick={onRetry}>重新加载快速排序</button></div>}
    <div className="usage-sort-note"><span>{selectedFirst ? '已选优先 · 组内沿用当前排序' : '仅调整标签库 · 不改变 Prompt 顺序'}</span><span>Danbooru 快照 · {snapshotDate ?? '日期未知'} · 非实时</span></div>
    <div className="results-heading"><h2><Grid2X2 size={17} />{searching ? '搜索结果' : favoritesOnly ? '收藏标签' : currentCategory?.name || '探索标签'}<span>{filtered.length.toLocaleString()}</span></h2><span>{query !== deferredQuery ? '搜索中…' : preferences.usage.enabled ? `当前范围已屏蔽 ${(scopeTags.length - eligibleTags.length).toLocaleString()} 条` : '点击标签加入 · 星标收藏'}</span></div>
    {filtered.length === 0 ? <div className="empty-search"><SearchX size={32} /><h3>{status === 'loading' ? '正在准备更多标签' : favoritesOnly && !preferences.folders.length ? '还没有收藏夹' : favoritesOnly && !scopeIds.size ? '这个收藏夹还没有单标签收藏' : '还没有找到这个标签'}</h3><p>{favoritesOnly && !scopeIds.size ? '标签组合显示在上方；组合内标签不会自动加星标。单标签收藏可在标签库点击星标添加，空收藏夹也可直接管理。' : '请检查关键词、分类和引用门槛。被屏蔽的标签和收藏记录没有被删除。'}</p>{preferences.usage.enabled && <button className="text-button" disabled={blocked} onClick={() => savedLibrary.setUsage({ ...preferences.usage, enabled: false })}>关闭引用屏蔽</button>}<button className="text-button" onClick={() => { setQuery(''); onCategory('all'); setSelection({ category: 'all', path: [] }); if (favoritesOnly) onScope('all'); }}>查看全部标签</button></div> : <div className="tag-grid" aria-busy={query !== deferredQuery}>{visibleTags.map(tag => <TagCard key={tag.id} tag={tag} selected={selectedIds.includes(tag.id)} favorite={favoriteIds.has(tag.id)} favoritesBlocked={blocked} onToggle={onToggle} onFavorite={setFavoriteTag} onEdit={onEditTag} />)}</div>}
    {filtered.length > 60 && <TagPagination page={currentPage} pageCount={pageCount} onPage={setPage} />}
    <div className="library-footer"><span><span className="local-dot" />{tags.length.toLocaleString()} 个标签 · {categories.length} 个分类</span><div className="library-footer-links"><a href={`${import.meta.env.BASE_URL}catalog/manifest.json`} target="_blank" rel="noreferrer">来源快照与说明 ↗</a><a href={`${import.meta.env.BASE_URL}licenses/third-party-notices.txt`} target="_blank" rel="noreferrer">开源许可 ↗</a></div></div><p className="catalog-disclaimer">英文原名来自 Danbooru 快照；中文为社区翻译，可能有误。服装、姿势等细类由本工具整理。</p></>}
    {favoriteTag && !blocked && <FavoriteTagDialog tag={favoriteTag} folders={preferences.folders} onMembership={savedLibrary.setMembership} onCreate={savedLibrary.createFolder} onClose={() => setFavoriteTag(null)} error={error} />}
    {resetOpen && <LibraryDialog title="重置收藏与筛选？" onClose={() => setResetOpen(false)}><p>此操作会用默认设置替换无法读取的收藏与筛选数据，原收藏夹、单标签收藏和标签组合将丢失。当前 Prompt 草稿不受影响。</p><div className="dialog-actions"><button autoFocus className="secondary-button" onClick={() => setResetOpen(false)}>保留原数据</button><button className="danger-button" onClick={() => { savedLibrary.reset(); changeFolder('all'); setResetOpen(false); }}>确认重置收藏与筛选</button></div></LibraryDialog>}
  </section>;
}
