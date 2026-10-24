import { ChevronRight, FolderTree } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { taxonomyTrees } from '../data/tagTaxonomy';
import type { TaxonomyNode } from '../data/tagTaxonomy';
import { getTagPaths } from '../lib/taxonomy';
import type { Tag, TagCategory } from '../types';

type Props = { category: TagCategory | 'all'; categoryName: string; tags: Tag[]; path: string[]; onPath: (path: string[]) => void };

export function SubcategoryFilter({ category, categoryName, tags, path, onPath }: Props) {
  const nodes = category === 'all' ? undefined : taxonomyTrees[category];
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    if (!nodes) return result;
    for (const tag of tags) {
      const prefixes = new Set<string>();
      for (const tagPath of tag.subcategoryPaths ?? getTagPaths(tag)) {
        for (let depth = 1; depth <= tagPath.length; depth++) prefixes.add(tagPath.slice(0, depth).join('/'));
      }
      for (const key of prefixes) result.set(key, (result.get(key) ?? 0) + 1);
    }
    return result;
  }, [tags, nodes]);
  useEffect(() => {
    if (!nodes || !path.length || (counts.get(path.join('/')) ?? 0) > 0) return;
    const next = [...path];
    while (next.length && !(counts.get(next.join('/')) ?? 0)) next.pop();
    onPath(next);
  }, [nodes, counts, path, onPath]);
  if (!nodes) return null;
  const levels: { nodes: TaxonomyNode[]; prefix: string[]; parent: string }[] = [];
  const crumbs: { label: string; path: string[] }[] = [];
  let current: TaxonomyNode[] | undefined = nodes;
  let parent = categoryName;
  for (let depth = 0; current?.length; depth++) {
    const prefix = path.slice(0, depth);
    const visible: TaxonomyNode[] = current.filter(node => (counts.get([...prefix, node.id].join('/')) ?? 0) > 0);
    if (!visible.length) break;
    levels.push({ nodes: visible, prefix, parent });
    const chosen: TaxonomyNode | undefined = visible.find(node => node.id === path[depth]);
    if (!chosen) break;
    crumbs.push({ label: chosen.label, path: path.slice(0, depth + 1) });
    parent = chosen.label; current = chosen.children;
  }
  return <section className="subcategory-panel" aria-label="小分类筛选"><nav className="subcategory-breadcrumb" aria-label="小分类路径"><FolderTree size={15} /><button onClick={() => onPath([])}>{categoryName}</button>{crumbs.map(crumb => <span key={crumb.path.join('/')}><ChevronRight size={12} /><button aria-current={crumb.path.length === path.length ? 'location' : undefined} onClick={() => onPath(crumb.path)}>{crumb.label}</button></span>)}</nav>
    {levels.map((level, depth) => <div className="facet-level" key={level.prefix.join('/') || 'root'}><span className="facet-caption">{depth === 0 ? '细分类' : '继续细分'}</span><div className="facet-options" role="group" aria-label={depth === 0 ? '细分类' : `${level.parent}细分`}><button className={!path[depth] ? 'active' : ''} aria-label={`${level.parent}全部`} aria-pressed={!path[depth]} onClick={() => onPath(level.prefix)}>全部</button>{level.nodes.map(node => {
      const next = [...level.prefix, node.id];
      const count = counts.get(next.join('/')) ?? 0;
      return <button key={node.id} className={path[depth] === node.id ? 'active' : ''} aria-pressed={path[depth] === node.id} onClick={() => onPath(next)}>{node.label}<span>{count.toLocaleString()}</span>{node.children && <ChevronRight size={11} />}</button>;
    })}</div></div>)}
    <p className="subcategory-hint">{category === 'copyright' ? '作品按本地核对清单及明确媒介限定归类，可跨媒介；未确认的保留待细分。' : category === 'general' ? '仅细分当前大类，按原始标签特征整理，可多归属；无法可靠判断的保留待细分。' : '小分类按词条特征整理，可多归属。'}数量按大类统计；当前结果还会同时应用搜索。{category === 'copyright' && <> <a href="/catalog/work-media-review.json" target="_blank" rel="noreferrer">分类核对记录 ↗</a></>}</p>
  </section>;
}
