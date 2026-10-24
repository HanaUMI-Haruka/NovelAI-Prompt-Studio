// 官方重命名：https://docs.novelai.net/en/image/tags/#renamed-tags
const RENAMED_TAGS: Record<string, string> = {
  v: 'peace sign', double_v: 'double peace', '|_|': 'bar eyes', '\\||/': 'open \\m/',
  ':|': 'neutral face', ';|': 'neutral face', '<|>_<|>': 'neco-arc eyes', '<|> <|>': 'neco-arc eyes',
  eyepatch_bikini: 'square bikini', 'tachi-e': 'character image',
};

export function toNovelAiTag(rawName: string): string {
  const renamed = Object.hasOwn(RENAMED_TAGS, rawName) ? RENAMED_TAGS[rawName] : undefined;
  if (renamed) return renamed;
  // 表情中的下划线本身就是标签的一部分，不能当作词间空格。
  if (/^[^a-zA-Z]*_[^a-zA-Z]*$/.test(rawName) || /^[oOxXuUtTqQ]_[oOxXuUtTqQ]$/.test(rawName)) return rawName;
  return rawName.replaceAll('_', ' ');
}

export function hasNovelAiSyntaxConflict(text: string): boolean {
  return /[|{}\[\]]|::/.test(text);
}
