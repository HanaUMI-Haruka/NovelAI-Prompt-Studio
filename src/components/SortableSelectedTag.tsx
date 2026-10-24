import { Eye, EyeOff, X } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tag } from '../types';
import { WeightControl } from './WeightControl';
import { hasNovelAiSyntaxConflict } from '../lib/novelai';

type Props = { tag: Tag; index: number; weight: number; dragDisabled: boolean; onWeight: (id: string, value: number) => void; onRemove: (id: string) => void; disabled: boolean; onToggleDisabled: (id: string) => void };

export function SortableSelectedTag({ tag, index, weight, dragDisabled, onWeight, onRemove, disabled, onToggleDisabled }: Props) {
  const { listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tag.id, disabled: dragDisabled });
  const canStartDrag = (target: EventTarget) => target instanceof Element && !target.closest('button, input, select, textarea, a, label, [contenteditable], .weight-controls');
  return <div ref={setNodeRef} className={`weighted-tag${!dragDisabled ? ' is-sortable' : ''}${isDragging ? ' is-dragging' : ''}${disabled ? ' is-disabled' : ''}`} data-tag-id={tag.id} role="listitem" style={{ transform: CSS.Transform.toString(transform), transition }}
    onMouseDown={event => { if (canStartDrag(event.target)) listeners?.onMouseDown?.(event); }} onTouchStart={event => { if (canStartDrag(event.target)) listeners?.onTouchStart?.(event); }}>
    <div className="weighted-tag-heading"><span className="chip-index">{String(index + 1).padStart(2, '0')}</span><div><strong>{tag.zh}</strong><span>{tag.en}</span></div><button type="button" className="toggle-weighted-tag" aria-pressed={!disabled} aria-label={`${disabled ? '启用' : '停用'}${tag.zh}`} title={disabled ? '启用标签，恢复输出' : '临时停用，保留顺序与权重'} onClick={() => onToggleDisabled(tag.id)}>{disabled ? <EyeOff size={16} /> : <Eye size={16} />}</button><button className="remove-weighted-tag" onClick={() => onRemove(tag.id)} aria-label={`移除${tag.zh}`}><X size={15} /></button></div>
    {disabled && <p className="disabled-tag-note">已停用 · 暂不参与输出，顺序与权重保留</p>}
    {!tag.en ? <p className="weight-error">请重新读取个人标签定义，或暂时停用此项后复制。</p> : hasNovelAiSyntaxConflict(tag.en) ? <p className="weight-error">此词条含控制符；可先停用或移除此项后复制。</p> : <WeightControl name={tag.zh} value={weight} onChange={value => onWeight(tag.id, value)} />}
  </div>;
}
