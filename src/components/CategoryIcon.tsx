import { Clapperboard, ContactRound, createLucideIcon, Eye, Mountain, Paintbrush, Palette, PersonStanding, Shapes, Shirt, Smile, Sun, Tags, UsersRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TagCategory } from '../types';

// 长发轮廓和刘海，避免用剪刀表达“头发”而产生“理发”的歧义。
const Hair = createLucideIcon('Hair', [
  ['path', { d: 'M5 20c-1-3-1-6-.5-9C5 5.8 8 3 12 3s7 2.8 7.5 8c.5 3 .5 6-.5 9', key: 'outline' }],
  ['path', { d: 'M7 20V11c3 0 5-2 6-5 0 3 1.5 5 4 6v8', key: 'fringe' }],
  ['path', { d: 'M9 15c0 2 1.3 4 3 4s3-2 3-4', key: 'face' }],
]);

// 按分类 ID 固定映射，调整分类顺序时不会串图标；类型约束保证每类都有图标。
const categoryIcons: Record<TagCategory, LucideIcon> = {
  'named-character': ContactRound,
  copyright: Clapperboard,
  clothing: Shirt,
  pose: PersonStanding,
  expression: Smile,
  character: UsersRound,
  hair: Hair,
  eyes: Eye,
  scene: Mountain,
  lighting: Sun,
  style: Palette,
  general: Shapes,
  artist: Paintbrush,
  meta: Tags,
};

export function CategoryIcon({ category, size = 18 }: { category: TagCategory; size?: number }) {
  const Icon = categoryIcons[category];
  return <Icon className="category-symbol" data-category={category} size={size} strokeWidth={1.8} aria-hidden="true" focusable="false" />;
}
