import { BookUser, Plus, Settings2 } from 'lucide-react';
import { TagCard } from './TagCard';
import type { Tag } from '../types';

type Props = {
  tags: Tag[];
  selectedIds: string[];
  favoriteIds: ReadonlySet<string>;
  favoritesBlocked: boolean;
  onToggle: (id: string) => void;
  onFavorite: (tag: Tag) => void;
  onEdit: (tag: Tag) => void;
  onCreate: () => void;
  onManage: () => void;
};

export function PersonalTagLibrary({ tags, selectedIds, favoriteIds, favoritesBlocked, onToggle, onFavorite, onEdit, onCreate, onManage }: Props) {
  return <section className="personal-tag-library" aria-labelledby="personal-library-title">
    <div className="personal-library-heading"><div><h2 id="personal-library-title"><BookUser size={19} />我的个人标签<span>{tags.length}</span></h2><p>点击标签加入 Prompt，已选标签再次点击即可移除。</p></div>
      <div className="personal-library-actions"><button className="secondary-button" onClick={onManage}><Settings2 size={15} />管理个人标签</button><button className="primary-button" onClick={onCreate}><Plus size={15} />新增个人标签</button></div>
    </div>
    {tags.length ? <div className="tag-grid">{tags.map(tag => <TagCard key={tag.id} tag={tag} selected={selectedIds.includes(tag.id)} favorite={favoriteIds.has(tag.id)} favoritesBlocked={favoritesBlocked} onToggle={onToggle} onFavorite={onFavorite} onEdit={onEdit} />)}</div>
      : <div className="empty-search"><BookUser size={32} /><h3>这里还没有自定义标签</h3><p>点击「新增个人标签」保存中英文词条，就能在这里直接点选使用。</p></div>}
    <p className="personal-library-note">全部自定义标签 · 保存在当前浏览器 · 不受搜索与引用屏蔽影响 <a href={`${import.meta.env.BASE_URL}licenses/third-party-notices.txt`} target="_blank" rel="noreferrer">开源许可 ↗</a></p>
  </section>;
}
