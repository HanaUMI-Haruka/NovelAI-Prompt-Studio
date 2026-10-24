import { BookmarkPlus } from 'lucide-react';
import { useState } from 'react';
import type { Tag } from '../types';
import type { FavoriteFolder } from '../lib/libraryPreferences';
import { FolderNameForm } from './FavoriteFolders';
import { LibraryDialog } from './LibraryDialog';
import { PromptChunkPreview } from './PromptChunkPreview';

type Props = { folders: FavoriteFolder[]; ids: string[]; weights: Record<string, number>; byId: ReadonlyMap<string, Tag>; onCreate: (name: string) => string; onSave: (folderId: string, name: string) => void; onClose: () => void; disabled: boolean; error: string | null; disabledIds?: string[] };

export function SavePromptChunkDialog({ folders, ids, weights, byId, onCreate, onSave, onClose, disabled, error, disabledIds }: Props) {
  const [name, setName] = useState(''); const [folderId, setFolderId] = useState(folders[0]?.id ?? ''); const [fieldError, setFieldError] = useState('');
  const current = folders.some(folder => folder.id === folderId) ? folderId : folders[0]?.id ?? '';
  return <LibraryDialog title="收藏标签组合" onClose={onClose} className="chunk-dialog">
    <p>将 {ids.length.toLocaleString()} 个标签按当前顺序、权重和启停状态存入收藏夹。调用时追加；重复标签保留当前权重及启停状态。</p>
    <PromptChunkPreview ids={ids} weights={weights} byId={byId} disabledIds={disabledIds} />
    <form className="chunk-form" onSubmit={event => {
      event.preventDefault();
      try { onSave(current, name); }
      catch (cause) { setFieldError(cause instanceof Error ? cause.message : '无法收藏标签组合。'); }
    }}>
      <label>组合名称<input autoFocus aria-label="组合名称" placeholder="例如：银发角色、常用画风" value={name} onChange={event => { setName(event.target.value); setFieldError(''); }} aria-invalid={Boolean(fieldError)} /></label>
      <label>保存到收藏夹<select aria-label="保存到收藏夹" value={current} disabled={!folders.length || disabled} onChange={event => { setFolderId(event.target.value); setFieldError(''); }}>{!folders.length && <option value="">请先新建收藏夹</option>}{folders.map(folder => <option value={folder.id} key={folder.id}>{folder.name}</option>)}</select></label>
      <p className="chunk-note">仅保存已选标签；自定义文本和排除提示词不包含在组合中。</p>
      {(fieldError || error) && <p className="library-field-error" role="alert">{fieldError || error}</p>}
      <button type="submit" className="primary-button" disabled={!ids.length || !current || disabled}><BookmarkPlus size={16} />保存组合</button>
    </form>
    <details className="create-folder-details" open={!folders.length || undefined}><summary>新建收藏夹</summary><FolderNameForm submitLabel="创建收藏夹" onSave={folderName => { setFolderId(onCreate(folderName)); setFieldError(''); }} /></details>
  </LibraryDialog>;
}
