export type TagCategory = 'named-character' | 'copyright' | 'character' | 'hair' | 'eyes' | 'expression' | 'clothing' | 'pose' | 'scene' | 'lighting' | 'style' | 'artist' | 'general' | 'meta';

export type Tag = {
  id: string;
  zh: string;
  en: string;
  category: TagCategory;
  aliases?: string[];
  rawName?: string;
  postCount?: number;
  sourceCategory?: number;
  searchText?: string;
  subcategoryPaths?: string[][];
  sourceOrder?: number;
  personalModified?: boolean;
};

export type PromptDraft = {
  version: 1;
  selectedTagIds: string[];
  tagWeights: Record<string, number>;
  disabledTagIds?: string[];
  customPositive: string;
  negativePrompt: string;
  updatedAt: string;
};

export type MobileView = 'library' | 'selected' | 'output';
export type LibraryScope = 'all' | 'favorites' | 'personal';
