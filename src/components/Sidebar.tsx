import { ArchiveRestore, ArrowUpRight, Bookmark, BookUser, ChevronRight, Grid2X2, Layers3, Palette, Settings2, Sparkles } from 'lucide-react';
import { categories } from '../data/sampleTags';
import type { LibraryScope, TagCategory } from '../types';
import { CategoryIcon } from './CategoryIcon';

type Props = { category: TagCategory | 'all'; onCategory: (value: TagCategory | 'all') => void; onInfo: (message: string) => void; counts: Record<TagCategory, number>; total: number; onFavorites: () => void; scope: LibraryScope; onAppearance: () => void; onBackup: () => void; onPersonal: () => void };

export function Sidebar({ category, onCategory, onInfo, counts, total, onFavorites, scope, onAppearance, onBackup, onPersonal }: Props) {
  const countLabel = (value: number) => new Intl.NumberFormat('zh-CN', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  return <aside className="sidebar">
    <a className="brand" href="#main" aria-label="AI Prompt Studio 主页"><span className="brand-icon"><Sparkles size={24} strokeWidth={1.7} /></span><span>Prompt Studio<span className="brand-sub">让灵感自由生长</span></span></a>
    <div className="workspace-card"><span className="workspace-icon"><Layers3 size={19} /></span><div><strong>我的创作空间</strong><span>本地工作区</span></div><span className="local-dot" title="本地模式" /></div>
    <div className="nav-caption">创作工具 <span>WORKSPACE</span></div>
    <nav aria-label="标签分类" className="category-nav">
      <button className={`nav-item category-nav-item ${scope === 'all' && category === 'all' ? 'active' : ''}`} aria-pressed={scope === 'all' && category === 'all'} onClick={() => onCategory('all')}><span className="category-icon" aria-hidden="true"><Grid2X2 size={18} strokeWidth={1.8} /></span><span>全部标签</span><small>{countLabel(total)}</small></button>
      <div className="nav-group-label">标签分类</div>
      {categories.map(item => <button key={item.id} className={`nav-item category-nav-item ${scope === 'all' && category === item.id ? 'active' : ''}`} aria-pressed={scope === 'all' && category === item.id} onClick={() => onCategory(item.id)}><span className="category-icon" aria-hidden="true"><CategoryIcon category={item.id} /></span><span>{item.name}</span><small>{countLabel(counts[item.id])}</small></button>)}
    </nav>
    <div className="sidebar-divider" />
    <nav aria-label="更多工具" className="more-nav">
      <button className={`nav-item ${scope === 'favorites' ? 'active' : ''}`} aria-pressed={scope === 'favorites'} onClick={onFavorites}><Bookmark size={18} /><span>我的收藏</span><ChevronRight size={14} /></button>
      <button className={`nav-item ${scope === 'personal' ? 'active' : ''}`} aria-pressed={scope === 'personal'} onClick={onPersonal}><BookUser size={18} /><span>个人标签库</span><ChevronRight size={14} /></button>
      <button className="nav-item" onClick={onAppearance}><Palette size={18} /><span>外观设置</span><ChevronRight size={14} /></button>
      <button className="nav-item" onClick={onBackup}><ArchiveRestore size={18} /><span>本地备份与恢复</span><ChevronRight size={14} /></button>
    </nav>
    <div className="sidebar-bottom"><div className="local-note"><span className="local-dot" /><div><strong>灵感留在你身边</strong><p>草稿仅保存在当前浏览器</p></div><ArrowUpRight size={15} /></div><button className="nav-item" onClick={() => onInfo('Danbooru 本地标签快照 + 社区中文译名，可能存在误译。服装、姿势等细类为本工具整理；权重数值语法适用 NovelAI V4 及以上。无需登录或密钥。')}><Settings2 size={17} /><span>数据与说明</span><small>v0.2</small></button></div>
  </aside>;
}
