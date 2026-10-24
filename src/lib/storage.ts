import type { PromptDraft } from '../types';
import { sampleTags } from '../data/sampleTags';

export const STORAGE_KEY = 'ai-prompt-studio:draft';
const knownIds = new Set(sampleTags.map(tag => tag.id));

export function createDraft(): PromptDraft {
  return { version: 1, selectedTagIds: [], tagWeights: {}, customPositive: '', negativePrompt: 'blurry, low resolution', updatedAt: new Date().toISOString() };
}

export function serializeDraft(draft: PromptDraft): string { return JSON.stringify(draft); }

export function readDraftState(storage?: Pick<Storage, 'getItem'>) {
  try {
    const result = parseDraft((storage ?? localStorage).getItem(STORAGE_KEY));
    return { draft: result.draft ?? createDraft(), error: result.error, blocked: result.error !== null };
  } catch {
    return { draft: createDraft(), error: '无法读取本地原草稿，已暂停写入。可继续临时编辑和复制；恢复存储权限后重新加载，或明确选择备份恢复。', blocked: true };
  }
}

export function parseDraft(raw: string | null): { draft: PromptDraft | null; error: string | null } {
  if (raw === null) return { draft: createDraft(), error: null };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') throw new Error('草稿格式无效。');
    const data = value as Record<string, unknown>;
    if (data.version !== 1) throw new Error('草稿版本暂不支持。');
    if (!Array.isArray(data.selectedTagIds) || !data.selectedTagIds.every(id => typeof id === 'string') ||
        typeof data.customPositive !== 'string' || typeof data.negativePrompt !== 'string' ||
        typeof data.updatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(data.updatedAt) || Number.isNaN(Date.parse(data.updatedAt))) {
      throw new Error('草稿字段损坏或格式无效。');
    }
    const selectedTagIds = [...new Set(data.selectedTagIds as string[])].filter(id => knownIds.has(id) || (id.startsWith('db:') && id.length > 3) || /^user:[a-zA-Z0-9-]+$/.test(id));
    if (data.disabledTagIds !== undefined && (!Array.isArray(data.disabledTagIds) || !data.disabledTagIds.every(id => typeof id === 'string'))) throw new Error('草稿停用标签字段损坏。');
    const tagWeights: Record<string, number> = {};
    if (data.tagWeights !== undefined) {
      if (!data.tagWeights || typeof data.tagWeights !== 'object' || Array.isArray(data.tagWeights)) throw new Error('草稿权重字段损坏。');
      for (const [id, weight] of Object.entries(data.tagWeights)) {
        if (typeof weight !== 'number' || !Number.isFinite(weight) || weight < 0 || weight > 3) throw new Error('草稿权重必须是0至3之间的数字。');
        if (selectedTagIds.includes(id)) tagWeights[id] = weight;
      }
    }
    return { draft: {
      version: 1,
      selectedTagIds,
      tagWeights,
      ...(data.disabledTagIds !== undefined ? { disabledTagIds: [...new Set(data.disabledTagIds as string[])].filter(id => selectedTagIds.includes(id)) } : {}),
      customPositive: data.customPositive,
      negativePrompt: data.negativePrompt,
      updatedAt: data.updatedAt,
    }, error: null };
  } catch (cause) {
    return { draft: null, error: cause instanceof SyntaxError ? '无法读取草稿：本地数据不是有效的 JSON。' : cause instanceof Error ? cause.message : '无法读取本地草稿。' };
  }
}
