import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { normalizeWeight } from '../lib/prompt';

type Props = { name: string; value: number; onChange: (value: number) => void };

export function WeightControl({ name, value, onChange }: Props) {
  const [input, setInput] = useState(String(value));
  const [error, setError] = useState(false);
  const errorId = useId();
  useEffect(() => setInput(String(value)), [value]);
  function change(raw: string) {
    setInput(raw);
    const number = Number(raw);
    if (raw.trim() && Number.isFinite(number) && number >= 0 && number <= 3) { setError(false); onChange(normalizeWeight(number)); }
    else setError(true);
  }
  function step(amount: number) { const next = normalizeWeight(Math.min(3, Math.max(0, value + amount))); setInput(String(next)); setError(false); onChange(next); }
  return <div className="weight-field"><div className="weight-controls"><span>权重</span><button aria-label={`减小${name}权重`} disabled={value <= 0} onClick={() => step(-0.1)}><Minus size={13} /></button><input type="number" min="0" max="3" step="0.1" inputMode="decimal" value={input} aria-label={`${name}权重`} aria-invalid={error} aria-describedby={error ? errorId : undefined} onChange={event => change(event.target.value)} onBlur={() => { if (error) { setInput(String(value)); setError(false); } }} /><button aria-label={`增大${name}权重`} disabled={value >= 3} onClick={() => step(0.1)}><Plus size={13} /></button><button className="weight-reset" aria-label={`恢复${name}默认权重`} title="恢复默认权重 1" onClick={() => { setInput('1'); setError(false); onChange(1); }}><RotateCcw size={12} /></button></div>{error && <span className="weight-error" id={errorId}>请输入0至3的数字；当前输出保留上次有效权重。</span>}</div>;
}
