import { BookmarkPlus, ListFilter, Plus } from 'lucide-react';
import { useRef, useState } from 'react';
import { closestCenter, DndContext, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { PromptDraft, Tag } from '../types';
import { SortableSelectedTag } from './SortableSelectedTag';

type Props = { selected: Tag[]; customPositive: string; weights: Record<string, number>; onWeight: (id: string, value: number) => void; onRemove: (id: string) => void; onMove: (activeId: string, overId: string | null) => void; onChange: (patch: Partial<PromptDraft>) => void; onSaveChunk: () => void; favoritesBlocked: boolean; favoritesError: string | null; onRetryFavorites: () => void; disabledIds: string[]; onToggleDisabled: (id: string) => void };

export function SelectedTags({ selected, customPositive, weights, onWeight, onRemove, onMove, onChange, onSaveChunk, favoritesBlocked, favoritesError, onRetryFavorites, disabledIds, onToggleDisabled }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));
  const activeTag = selected.find(tag => tag.id === activeId);
  const describe = (id: string | number) => selected.find(tag => tag.id === id)?.zh ?? String(id);
  const position = (id: string | number) => selected.findIndex(tag => tag.id === id) + 1;
  const collisionDetection: CollisionDetection = args => {
    const point = args.pointerCoordinates; const rect = listRef.current?.getBoundingClientRect();
    if (point && rect && (point.x < rect.left || point.x > rect.right || point.y < rect.top || point.y > rect.bottom)) return [];
    return closestCenter(args);
  };
  return <section className="selected-section" aria-labelledby="selected-title"><div className="section-heading"><h2 id="selected-title"><ListFilter size={17} />已选标签 <span className="count-badge">{selected.length}</span></h2><span>拖拽调整顺序</span></div>
    <p className="drag-sort-help">按住标签块拖动调整先后，松开后更新 Prompt。<span className="touch-drag-note">手机长按后拖动，直接滑动可滚动页面。</span></p>
    {disabledIds.length > 0 && <p className="disabled-tag-note">{selected.filter(tag => disabledIds.includes(tag.id)).length} 个标签已停用，点击眼睛图标可恢复输出。</p>}
    <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={({ active }) => setActiveId(String(active.id))} onDragCancel={() => setActiveId(null)} onDragEnd={({ active, over }) => { setActiveId(null); onMove(String(active.id), over ? String(over.id) : null); }} accessibility={{
      screenReaderInstructions: { draggable: '' },
      announcements: {
        onDragStart: ({ active }) => `开始移动${describe(active.id)}，当前第${position(active.id)}项，共${selected.length}项。`,
        onDragOver: ({ active, over }) => over ? `${describe(active.id)}将移动到第${position(over.id)}项。` : '已离开标签列表，松开将保留原顺序。',
        onDragEnd: ({ active, over }) => over ? `${describe(active.id)}已放到第${position(over.id)}项。` : '已取消移动，顺序保持。',
        onDragCancel: () => '已取消移动，顺序保持。',
      },
    }}>
      <SortableContext items={selected.map(tag => tag.id)} strategy={verticalListSortingStrategy}>
        <div ref={listRef} className={`selected-tags weighted-tags ${!selected.length ? 'is-empty' : ''}`} role={selected.length ? 'list' : undefined} aria-label="已选标签排序列表">{selected.length ? selected.map((tag, index) => <SortableSelectedTag key={tag.id} tag={tag} index={index} weight={weights[tag.id] ?? 1} dragDisabled={selected.length < 2} onWeight={onWeight} onRemove={onRemove} disabled={disabledIds.includes(tag.id)} onToggleDisabled={onToggleDisabled} />) : <><span className="empty-plus"><Plus size={20} /></span><strong>你的画面，从这里开始</strong><p>点击标签库中的标签，构建第一份 Prompt</p></>}</div>
      </SortableContext>
      <DragOverlay dropAnimation={null}>{activeTag && <div className="drag-tag-overlay" aria-hidden="true"><div><strong>{activeTag.zh}{disabledIds.includes(activeTag.id) ? ' · 已停用' : ''}</strong><span>{activeTag.en}</span></div><small>{weights[activeTag.id] ?? 1}×</small></div>}</DragOverlay>
    </DndContext>
    <p className="weight-help">默认 1 · 小于 1 减弱 · 大于 1 增强<br />输出 NovelAI V4+ 数值权重，每段自动闭合。</p>
    <div className="save-chunk-area"><button type="button" className="secondary-button save-chunk-button" disabled={!selected.length || favoritesBlocked} onClick={onSaveChunk}><BookmarkPlus size={16} />收藏标签组合</button><p>保存这组标签的顺序与权重，方便下次整组追加。</p>{favoritesError && <div className="chunk-storage-error" role="alert">{favoritesError}{favoritesBlocked ? <span>请在“我的收藏”处理数据读取提示后再收藏组合。</span> : <button onClick={onRetryFavorites}>重试保存收藏</button>}</div>}</div>
    <label className="input-label" htmlFor="custom-positive">自定义标签 <span>可选</span></label><textarea id="custom-positive" rows={3} placeholder="添加更多英文标签，如：floating islands, clouds" value={customPositive} onChange={event => onChange({ customPositive: event.target.value })} spellCheck={false} /><p className="field-hint">使用逗号或换行分隔，自动追加到正向 Prompt。</p>
  </section>;
}
