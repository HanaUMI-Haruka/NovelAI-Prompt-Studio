import { Check, Star } from 'lucide-react';
import type { Tag } from '../types';
import type { FavoriteFolder } from '../lib/libraryPreferences';
import { FolderNameForm } from './FavoriteFolders';
import { LibraryDialog } from './LibraryDialog';

type Props = { tag: Tag; folders: FavoriteFolder[]; onMembership: (folderId: string, tagId: string, included: boolean) => void; onCreate: (name: string, tagId: string) => string; onClose: () => void; error: string | null };

export function FavoriteTagDialog({ tag, folders, onMembership, onCreate, onClose, error }: Props) {
  return <LibraryDialog title="收藏标签" onClose={onClose}>
    <div className="favorite-tag-summary"><Star size={19} /><div><strong>{tag.zh}</strong><span>{tag.en}</span></div></div>
    <p>可加入多个收藏夹，勾选后自动保存；取消勾选可移出该收藏夹。</p>
    <div className="folder-memberships" role="group" aria-label="选择收藏夹">{folders.length ? folders.map(folder => <label key={folder.id}><input type="checkbox" checked={folder.tagIds.includes(tag.id)} onChange={event => onMembership(folder.id, tag.id, event.target.checked)} /><span>{folder.name}</span><small>{folder.tagIds.length.toLocaleString()}</small></label>) : <p>还没有收藏夹，在下面创建一个即可收藏此标签。</p>}</div>
    <details className="create-folder-details" open={!folders.length || undefined}><summary>新建收藏夹并收藏</summary><FolderNameForm submitLabel="创建并收藏" onSave={name => { onCreate(name, tag.id); }} /></details>
    {error && <p className="library-field-error" role="alert">{error}</p>}
    <button className="primary-button" onClick={onClose}><Check size={16} />完成</button>
  </LibraryDialog>;
}
