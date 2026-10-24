import { FolderHeart, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FavoriteFolder } from '../lib/libraryPreferences';
import { LibraryDialog } from './LibraryDialog';

export function FolderNameForm({ initialName = '', submitLabel, onSave }: { initialName?: string; submitLabel: string; onSave: (name: string) => void }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  return <form className="folder-name-form" onSubmit={event => {
    event.preventDefault();
    try { onSave(name); setName(''); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '无法保存收藏夹。'); }
  }}><label>收藏夹名称<input autoFocus aria-label="收藏夹名称" placeholder="例如：常用角色、服装灵感" value={name} aria-invalid={Boolean(error)} onChange={event => { setName(event.target.value); setError(''); }} /></label>{error && <p className="library-field-error" role="alert">{error}</p>}<button className="secondary-button" type="submit"><FolderPlus size={15} />{submitLabel}</button></form>;
}

type Props = { folders: FavoriteFolder[]; current: string; onCurrent: (id: string) => void; onCreate: (name: string) => string; onRename: (id: string, name: string) => void; onDelete: (id: string) => void; disabled: boolean };
type FolderAction = { type: 'create' } | { type: 'rename' | 'delete'; id: string };

export function FavoriteFolders({ folders, current, onCurrent, onCreate, onRename, onDelete, disabled }: Props) {
  const [action, setAction] = useState<FolderAction | null>(null);
  const folder = folders.find(item => item.id === current);
  const targetFolder = action && action.type !== 'create' ? folders.find(item => item.id === action.id) : undefined;
  return <section className="favorite-folders" aria-label="收藏夹管理">
    <div className="folder-manager-heading"><h3><FolderHeart size={18} />收藏夹管理<span>{folders.length.toLocaleString()}</span></h3><button type="button" disabled={disabled} onClick={() => setAction({ type: 'create' })}><FolderPlus size={15} />新建收藏夹</button></div>
    <div className="folder-controls"><label><span>当前收藏夹</span><select aria-label="当前收藏夹" value={folder ? current : 'all'} onChange={event => onCurrent(event.target.value)}><option value="all">全部收藏</option>{folders.map(item => <option key={item.id} value={item.id}>{item.name} · {item.tagIds.length.toLocaleString()} 标签 / {item.chunks.length.toLocaleString()} 组合</option>)}</select></label></div>
    <ul className="folder-list" aria-label="收藏夹列表">{folders.map(item => <li key={item.id} className={`folder-list-item${item.id === current ? ' is-current' : ''}`}>
      <button type="button" className="folder-entry-select" aria-label={`查看收藏夹「${item.name}」`} aria-pressed={item.id === current} title={item.name} onClick={() => onCurrent(item.id)}><span>{item.name}</span><small>{item.tagIds.length.toLocaleString()} 个标签 · {item.chunks.length.toLocaleString()} 个组合{!item.tagIds.length && !item.chunks.length && ' · 空收藏夹'}</small></button>
      <div className="folder-row-actions"><button type="button" disabled={disabled} aria-label={`编辑收藏夹「${item.name}」`} title="修改收藏夹名称" onClick={() => setAction({ type: 'rename', id: item.id })}><Pencil size={14} />编辑</button><button type="button" className="folder-row-delete" disabled={disabled} aria-label={`删除收藏夹「${item.name}」`} onClick={() => setAction({ type: 'delete', id: item.id })}><Trash2 size={14} />删除</button></div>
    </li>)}</ul>
    {!folders.length && <p className="folder-manager-empty">还没有收藏夹，点击上方“新建收藏夹”即可创建，无需先收藏标签。</p>}
    <p>空收藏夹也可直接编辑、删除。星标管理单标签，整组收藏在下方“标签组合”查看；数量包含暂时被屏蔽或尚未加载的标签。</p>
    {action?.type === 'create' && <LibraryDialog title="新建收藏夹" onClose={() => setAction(null)}><FolderNameForm submitLabel="创建收藏夹" onSave={name => { const id = onCreate(name); onCurrent(id); setAction(null); }} /></LibraryDialog>}
    {action?.type === 'rename' && targetFolder && <LibraryDialog title="编辑收藏夹" onClose={() => setAction(null)}><FolderNameForm initialName={targetFolder.name} submitLabel="保存名称" onSave={name => { onRename(targetFolder.id, name); setAction(null); }} /></LibraryDialog>}
    {action?.type === 'delete' && targetFolder && <LibraryDialog title="删除收藏夹？" onClose={() => setAction(null)}><p>将删除「{targetFolder.name}」及其中 {targetFolder.tagIds.length.toLocaleString()} 条单标签收藏、{targetFolder.chunks.length.toLocaleString()} 个标签组合。其他收藏夹、标签库和当前 Prompt 不受影响。此操作无法撤销。</p><div className="dialog-actions"><button autoFocus className="secondary-button" onClick={() => setAction(null)}>保留收藏夹</button><button className="danger-button" onClick={() => { onDelete(targetFolder.id); if (current === targetFolder.id) onCurrent('all'); setAction(null); }}>确认删除收藏夹</button></div></LibraryDialog>}
  </section>;
}
