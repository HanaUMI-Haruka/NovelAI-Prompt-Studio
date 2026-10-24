import { Bookmark, ChevronDown, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import type { Tag } from '../types';
import type { FavoriteFolder } from '../lib/libraryPreferences';
import type { PromptChunk } from '../lib/promptChunks';
import { LibraryDialog } from './LibraryDialog';
import { PromptChunkPreview } from './PromptChunkPreview';

type Props = { folders: FavoriteFolder[]; current: string; byId: ReadonlyMap<string, Tag>; onUse: (chunk: PromptChunk) => void; onRename: (folderId: string, chunkId: string, name: string) => void; onDelete: (folderId: string, chunkId: string) => void; disabled: boolean };

function ChunkCard({ folder, chunk, byId, disabled, onUse, onAction }: { folder: FavoriteFolder; chunk: PromptChunk; byId: ReadonlyMap<string, Tag>; disabled: boolean; onUse: Props['onUse']; onAction: (type: 'rename' | 'delete') => void }) {
  const [expanded, setExpanded] = useState(false); const previewId = useId();
  return <li className="chunk-card">
    <div className="chunk-card-heading"><div><h4>{chunk.name}</h4><span>{folder.name} · {chunk.selectedTagIds.length.toLocaleString()} 个标签</span></div><button className="chunk-use" onClick={() => onUse(chunk)} aria-label={`追加组合「${chunk.name}」`}><Plus size={15} />追加</button></div>
    <p className="chunk-card-summary">{chunk.selectedTagIds.slice(0, 4).map(id => byId.get(id)?.zh ?? (id.startsWith('db:') ? id.slice(3) : id)).join(' · ')}{chunk.selectedTagIds.length > 4 && ' …'}</p>
    <div className="chunk-card-actions"><button aria-expanded={expanded} aria-controls={previewId} aria-label={`预览组合「${chunk.name}」`} onClick={() => setExpanded(!expanded)}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}{expanded ? '收起预览' : '预览标签与权重'}</button><button disabled={disabled} onClick={() => onAction('rename')} aria-label={`重命名组合「${chunk.name}」`}><Pencil size={13} />重命名</button><button disabled={disabled} className="chunk-delete" onClick={() => onAction('delete')} aria-label={`删除组合「${chunk.name}」`}><Trash2 size={13} />删除</button></div>
    <div id={previewId}>{expanded && <PromptChunkPreview ids={chunk.selectedTagIds} weights={chunk.tagWeights} byId={byId} disabledIds={chunk.disabledTagIds} />}</div>
  </li>;
}

export function PromptChunkList({ folders, current, byId, onUse, onRename, onDelete, disabled }: Props) {
  const titleId = useId();
  const [action, setAction] = useState<{ type: 'rename' | 'delete'; folderId: string; chunkId: string } | null>(null);
  const [name, setName] = useState(''); const [error, setError] = useState('');
  const entries = folders.filter(folder => current === 'all' || folder.id === current).flatMap(folder => folder.chunks.map(chunk => ({ folder, chunk })));
  const target = action ? folders.find(folder => folder.id === action.folderId)?.chunks.find(chunk => chunk.id === action.chunkId) : undefined;
  return <section className="prompt-chunks" aria-labelledby={titleId}>
    <div className="chunks-heading"><h3 id={titleId}><Bookmark size={17} />标签组合 <span>{entries.length.toLocaleString()}</span></h3><span>保留顺序 · 整组复用</span></div>
    <p className="chunk-note">按上方收藏夹查看，独立于下方单标签筛选。追加时保留当前标签顺序与权重，只补入新标签。</p>
    {entries.length ? <ul className="chunk-list">{entries.map(({ folder, chunk }) => <ChunkCard key={chunk.id} folder={folder} chunk={chunk} byId={byId} disabled={disabled} onUse={onUse} onAction={type => { setAction({ type, folderId: folder.id, chunkId: chunk.id }); setName(chunk.name); setError(''); }} />)}</ul> : <p className="chunks-empty">还没有标签组合。选好标签后，在“已选标签”区域点击“收藏标签组合”。</p>}
    {action?.type === 'rename' && target && <LibraryDialog title="重命名标签组合" onClose={() => setAction(null)}><form className="chunk-form" onSubmit={event => { event.preventDefault(); try { onRename(action.folderId, target.id, name); setAction(null); } catch (cause) { setError(cause instanceof Error ? cause.message : '无法重命名组合。'); } }}><label>组合名称<input autoFocus aria-label="组合名称" value={name} aria-invalid={Boolean(error)} onChange={event => { setName(event.target.value); setError(''); }} /></label>{error && <p className="library-field-error" role="alert">{error}</p>}<button className="primary-button" type="submit" disabled={disabled}>保存名称</button></form></LibraryDialog>}
    {action?.type === 'delete' && target && <LibraryDialog title="删除标签组合？" onClose={() => setAction(null)}><p>将删除「{target.name}」。当前 Prompt、单标签收藏和其他组合不受影响。此操作无法撤销。</p>{error && <p className="library-field-error" role="alert">{error}</p>}<div className="dialog-actions"><button autoFocus className="secondary-button" onClick={() => setAction(null)}>保留组合</button><button className="danger-button" disabled={disabled} onClick={() => { try { onDelete(action.folderId, target.id); setAction(null); } catch (cause) { setError(cause instanceof Error ? cause.message : '无法删除组合。'); } }}>确认删除组合</button></div></LibraryDialog>}
  </section>;
}
