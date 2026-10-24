export const themes = [
  { id: 'sky', name: '晴空蓝白', mode: 'light', description: '清透蓝与纯白，明亮利落的创作工作台。', color: '#f3f7fc', badge: '清爽 · 浅色' },
  { id: 'matcha', name: '抹茶米白', mode: 'light', description: '柔和米白与森林绿，像翻开一本灵感手札。', color: '#f5f3e9', badge: '自然 · 浅色' },
  { id: 'coral', name: '落日珊瑚', mode: 'light', description: '暖白、陶红与柔和圆角，为创作添一点温度。', color: '#fff5ef', badge: '温暖 · 浅色' },
  { id: 'ocean', name: '深海青蓝', mode: 'dark', description: '层次深蓝与青色微光，安静专注的夜间空间。', color: '#0d1926', badge: '静谧 · 深色' },
  { id: 'violet', name: '经典紫夜', mode: 'dark', description: '保留熟悉的黑紫风格，延续原来的使用习惯。', color: '#101015', badge: '经典 · 深色' },
] as const;

export type ThemeId = typeof themes[number]['id'];
