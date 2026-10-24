import { Check, Palette, SunMoon } from 'lucide-react';
import { themes } from '../data/themes';
import type { ThemeId } from '../data/themes';
import { LibraryDialog } from './LibraryDialog';

type Props = { theme: ThemeId; onSelect: (id: ThemeId) => void; error: string | null; onRetry: () => void; onClose: () => void };

export function AppearanceSettings({ theme, onSelect, error, onRetry, onClose }: Props) {
  return <LibraryDialog title="外观设置" className="appearance-dialog" closeLabel="关闭外观设置" onClose={onClose}>
    <div className="appearance-intro"><span><Palette size={25} /></span><div><strong>换个心情，继续创作。</strong><p>选择你喜欢的工作空间，整页即时切换。</p></div></div>
    <fieldset className="theme-grid"><legend>选择界面主题</legend>{themes.map(item => <label key={item.id} className={`theme-choice ${theme === item.id ? 'is-current' : ''}`}>
      <input type="radio" name="appearance-theme" value={item.id} checked={theme === item.id} onChange={() => onSelect(item.id)} aria-label={item.name} />
      <span className="theme-miniature" data-theme={item.id} aria-hidden="true"><span className="mini-sidebar"><i /><b /><b /><b /><b /></span><span className="mini-workspace"><span className="mini-header"><i /><b /></span><span className="mini-banner" /><span className="mini-search" /><span className="mini-tags"><i /><i /><i /><i /></span></span><span className="mini-composer"><b /><i /><span /><em /></span></span>
      <span className="theme-choice-heading"><strong>{item.name}</strong><small>{theme === item.id ? <><Check size={12} />使用中</> : item.badge}</small></span><span className="theme-description">{item.description}</span>
    </label>)}</fieldset>
    {error && <div className="appearance-error" role="alert"><p>{error}</p><button className="secondary-button" onClick={onRetry}>重试保存外观</button></div>}
    <div className="appearance-footer"><span><SunMoon size={15} />仅更换外观，草稿与收藏保持原样。</span><button className="secondary-button" onClick={onClose}>完成</button></div>
    <p className="appearance-save-note" role="status">{error ? '当前仅在此页面应用，外观偏好尚未保存。' : '选择后自动保存在当前浏览器，下次打开沿用。'}</p>
  </LibraryDialog>;
}
