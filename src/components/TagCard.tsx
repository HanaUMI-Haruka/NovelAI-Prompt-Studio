import { Pencil, Star } from 'lucide-react';
import { categories } from '../data/sampleTags';
import { hasNovelAiSyntaxConflict } from '../lib/novelai';
import { formatPostCount } from '../lib/taxonomy';
import type { Tag } from '../types';

type Props = { tag: Tag; selected: boolean; favorite: boolean; favoritesBlocked: boolean; onToggle: (id: string) => void; onFavorite: (tag: Tag) => void; onEdit: (tag: Tag) => void };

export function TagCard({ tag, selected, favorite, favoritesBlocked, onToggle, onFavorite, onEdit }: Props) {
  const conflict = hasNovelAiSyntaxConflict(tag.en);
  const meta = categories.find(item => item.id === tag.category)!;
  return <article className={`tag-card ${selected ? 'is-selected' : ''} ${conflict ? 'has-conflict' : ''}`}>
    <button className="tag-select" disabled={conflict} title={conflict ? `NovelAI 格式冲突：${tag.rawName ?? tag.en}，暂未核验可用写法，不能自动加入。` : tag.id.startsWith('user:') ? '个人标签，无Danbooru引用统计，不受低引用门槛影响。' : tag.rawName ? `Danbooru: ${tag.rawName}\n中文为社区译名；${formatPostCount(tag.postCount)}` : '基础示例标签，暂无Danbooru引用数据'}
      aria-pressed={selected} aria-label={`${tag.zh} / ${tag.en}${conflict ? '，格式冲突，暂不支持自动加入' : selected ? '，已选择，点击移除' : '，点击添加'}`} onClick={() => onToggle(tag.id)}>
      <span className="tag-topline"><span className="category-label"><i style={{ background: meta.color }} />{meta.name.split(' / ')[0]}</span></span>
      <strong>{tag.zh}</strong><span className="tag-english">{tag.en}</span><span className="tag-card-meta"><data className="tag-usage" value={tag.postCount?.toString() ?? ''}>{tag.id.startsWith('user:') ? '个人标签' : tag.personalModified ? `${formatPostCount(tag.postCount)} · 个人修正` : formatPostCount(tag.postCount)}</data>{conflict ? <span className="conflict-marker">格式冲突</span> : selected && <span className="selected-marker">已选择</span>}</span>
    </button>
    <button className={`favorite-star ${favorite ? 'is-favorite' : ''}`} disabled={favoritesBlocked} aria-label={`${tag.zh} / ${tag.en}，${favorite ? '已收藏，管理收藏夹' : '收藏到收藏夹'}`} aria-pressed={favorite} title={favorite ? '管理收藏夹' : '收藏到收藏夹'} onClick={() => onFavorite(tag)}><Star size={17} fill={favorite ? 'currentColor' : 'none'} /></button>
    <button className="tag-edit" aria-label={`编辑标签「${tag.zh}」`} title={tag.id.startsWith('user:') ? '编辑个人标签' : '编辑个人译名与分类'} onClick={() => onEdit(tag)}><Pencil size={14} /></button>
  </article>;
}
