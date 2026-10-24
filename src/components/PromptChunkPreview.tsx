import type { Tag } from '../types';
import { toNovelAiTag } from '../lib/novelai';

export function PromptChunkPreview({ ids, weights, byId, disabledIds = [] }: { ids: string[]; weights: Record<string, number>; byId: ReadonlyMap<string, Tag>; disabledIds?: string[] }) {
  return <ol className="chunk-preview" aria-label="组合标签顺序和权重">{ids.map(id => {
    const tag = byId.get(id);
    const fallback = id.startsWith('db:') ? toNovelAiTag(id.slice(3)) : id;
    return <li key={id}><div><strong>{tag?.zh ?? fallback}{disabledIds.includes(id) ? ' · 已停用' : ''}</strong><span>{tag?.en ?? fallback}</span></div><small aria-label={`权重 ${weights[id] ?? 1}`}>{weights[id] ?? 1}×</small></li>;
  })}</ol>;
}
