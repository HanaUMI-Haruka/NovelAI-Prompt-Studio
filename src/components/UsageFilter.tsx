import { Filter, Triangle } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { parseUsageThreshold } from '../lib/libraryPreferences';
import type { UsageThreshold } from '../lib/libraryPreferences';

export function UsageFilter({ usage, onChange, disabled }: { usage: UsageThreshold; onChange: (usage: UsageThreshold) => void; disabled: boolean }) {
  const [text, setText] = useState(String(usage.minimum));
  const [error, setError] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const errorId = useId();
  const contentId = useId();
  useEffect(() => { setText(String(usage.minimum)); setError(''); }, [usage.minimum]);
  return <div className={`usage-filter${collapsed ? ' is-collapsed' : ''}`}>
    <div className="usage-filter-heading">
      <button type="button" className="usage-collapse" aria-expanded={!collapsed} aria-controls={contentId} aria-label={collapsed ? '展开引用屏蔽设置' : '折叠引用屏蔽设置'} title={collapsed ? '展开引用屏蔽设置' : '折叠引用屏蔽设置'} onClick={() => setCollapsed(value => !value)}><Triangle size={10} fill="currentColor" strokeWidth={0} aria-hidden="true" /></button>
      <label className="usage-toggle"><input type="checkbox" disabled={disabled} checked={usage.enabled} onChange={event => onChange({ ...usage, enabled: event.target.checked })} />{!collapsed && <Filter size={14} />}屏蔽低引用标签</label>
    </div>
    <div id={contentId} className="usage-filter-content" hidden={collapsed}>
    <div className="usage-presets" role="group" aria-label="引用门槛预设">{[100, 1000, 10000].map(minimum => <button key={minimum} disabled={disabled} aria-pressed={usage.enabled && usage.minimum === minimum} onClick={() => { setText(String(minimum)); setError(''); onChange({ enabled: true, minimum }); }}>{minimum.toLocaleString()}</button>)}</div>
    <form className="usage-custom" onSubmit={event => {
      event.preventDefault();
      const minimum = parseUsageThreshold(text);
      if (minimum === null) { setError('请输入 0–9,007,199,254,740,991 范围内的整数。'); return; }
      setError(''); setText(String(minimum)); onChange({ enabled: true, minimum });
    }}><label><span>最低引用次数</span><input aria-label="最低引用次数" type="text" inputMode="numeric" value={text} disabled={disabled} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={event => { setText(event.target.value); setError(''); }} /></label><button disabled={disabled} type="submit">应用</button></form>
    {error && <p id={errorId} className="library-field-error" role="alert">{error}</p>}
    <p className="usage-filter-note">{usage.enabled ? `正在隐藏引用少于 ${usage.minimum.toLocaleString()} 次及引用数据未知的标签。` : '未开启屏蔽，显示所有引用频次的标签。'}仅隐藏列表，已有 Prompt 和收藏会保留。</p>
    </div>
  </div>;
}
