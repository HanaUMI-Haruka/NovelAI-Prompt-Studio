import { Check, Copy, FileText, ShieldMinus, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PromptDraft } from '../types';

async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  } catch { /* 权限受限时尝试浏览器本地后备复制。 */ }
  const previousFocus = document.activeElement as HTMLElement | null;
  const field = document.createElement('textarea');
  field.value = text;
  field.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(field);
  try { field.focus(); field.select(); if (!document.execCommand('copy')) throw new Error('copy unavailable'); }
  finally { field.remove(); previousFocus?.focus(); }
}

type Props = { prompt: string; negativePrompt: string; onChange: (patch: Partial<PromptDraft>) => void; onInfo: (message: string) => void; copyBlocked?: boolean };

export function PromptOutput({ prompt, negativePrompt, onChange, onInfo, copyBlocked = false }: Props) {
  const [copied, setCopied] = useState<'positive' | 'negative' | null>(null);
  const copyGeneration = useRef(0);
  async function handleCopy(text: string, kind: 'positive' | 'negative') {
    const generation = ++copyGeneration.current;
    try {
      await copyText(text); setCopied(kind); onInfo(`${kind === 'positive' ? '正向' : '排除'} Prompt 已复制到剪贴板`);
      window.setTimeout(() => { if (generation === copyGeneration.current) setCopied(null); }, 2000);
    } catch { onInfo('复制失败：浏览器限制了剪贴板，请选中输出文本后按 Ctrl+C（手机可长按复制）。'); }
  }
  return <section className="output-section" aria-labelledby="output-title">
    <div className="section-heading"><h2 id="output-title"><FileText size={17} />Prompt 输出</h2><span className="live-label"><i />实时生成</span></div>
    <div className="prompt-box"><div className="prompt-box-heading"><span><Sparkles size={15} />正向提示词</span><span>POSITIVE</span></div><textarea aria-label="正向 Prompt 输出" readOnly value={prompt} placeholder="选择标签后，英文 Prompt 会在这里实时生成…" rows={5} spellCheck={false} /><div className="prompt-box-footer"><span>{prompt.length} 字符</span><span>英文 · 逗号分隔</span></div></div>
    {copyBlocked && <p className="weight-error" role="alert">启用的标签含未适配控制符或个人定义无法读取。上方仅预览其余内容，请先恢复定义，或停用、移除问题标签后复制。</p>}
    <button className="primary-button" disabled={!prompt || copyBlocked} onClick={() => void handleCopy(prompt, 'positive')}>{copied === 'positive' ? <Check size={17} /> : <Copy size={17} />}{copied === 'positive' ? '已复制' : '复制正向 Prompt'}</button>
    <div className="negative-heading"><label htmlFor="negative-prompt"><ShieldMinus size={15} />排除提示词</label><span>NEGATIVE</span></div><textarea id="negative-prompt" value={negativePrompt} onChange={event => onChange({ negativePrompt: event.target.value })} rows={3} spellCheck={false} placeholder="不希望出现在画面中的内容…" /><button className="secondary-button" disabled={!negativePrompt.trim()} onClick={() => void handleCopy(negativePrompt.trim(), 'negative')}>{copied === 'negative' ? <Check size={15} /> : <Copy size={15} />}{copied === 'negative' ? '已复制' : '复制排除 Prompt'}</button>
    <div className="output-tip"><Sparkles size={16} /><p>为 NovelAI V4 及以上输出权重语法。<br /><span>如 1.2::silver hair ::，默认权重 1 不添加语法。</span><br /><a href="https://docs.novelai.net/en/image/strengthening-weakening/" target="_blank" rel="noreferrer">查看 NovelAI 官方权重说明 ↗</a></p></div>
  </section>;
}
