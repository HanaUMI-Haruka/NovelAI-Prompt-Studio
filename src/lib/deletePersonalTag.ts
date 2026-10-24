import type { PromptDraft } from '../types';
import type { LibraryPreferences } from './libraryPreferences';
import type { PersonalPreferences } from './personalTags';

type Selection = Pick<PromptDraft, 'selectedTagIds' | 'tagWeights' | 'disabledTagIds'>;
type PersonalTagData = { personal: PersonalPreferences; library: LibraryPreferences; draft: PromptDraft };
export type PersonalTagDeletionImpact = { selected: boolean; folders: number; chunks: number; emptyChunks: number };

export function removeTagFromSelection<T extends Selection>(value: T, id: string): T {
  if (!value.selectedTagIds.includes(id) && !Object.hasOwn(value.tagWeights, id) && !value.disabledTagIds?.includes(id)) return value;
  const tagWeights = { ...value.tagWeights }; delete tagWeights[id];
  return { ...value, selectedTagIds: value.selectedTagIds.filter(tagId => tagId !== id), tagWeights, ...(value.disabledTagIds ? { disabledTagIds: value.disabledTagIds.filter(tagId => tagId !== id) } : {}) };
}

export function getPersonalTagDeletionImpact(data: PersonalTagData, id: string): PersonalTagDeletionImpact {
  const chunks = data.library.folders.flatMap(folder => folder.chunks).filter(chunk => chunk.selectedTagIds.includes(id));
  return { selected: data.draft.selectedTagIds.includes(id), folders: data.library.folders.filter(folder => folder.tagIds.includes(id)).length, chunks: chunks.length, emptyChunks: chunks.filter(chunk => chunk.selectedTagIds.every(tagId => tagId === id)).length };
}

export function planPersonalTagDeletion(data: PersonalTagData, id: string): PersonalTagData {
  if (!id.startsWith('user:') || !data.personal.tags.some(tag => tag.id === id)) throw new Error('这个自定义标签已不存在，不能删除内置词条。');
  const draft = removeTagFromSelection(data.draft, id);
  return {
    personal: { ...data.personal, tags: data.personal.tags.filter(tag => tag.id !== id) },
    draft: draft === data.draft ? draft : { ...draft, updatedAt: new Date().toISOString() },
    library: { ...data.library, folders: data.library.folders.map(folder => ({ ...folder,
      tagIds: folder.tagIds.filter(tagId => tagId !== id),
      chunks: folder.chunks.map(chunk => removeTagFromSelection(chunk, id)).filter(chunk => chunk.selectedTagIds.length > 0),
    })) },
  };
}
