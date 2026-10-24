import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

type Props = { open: boolean; onClose: () => void; onConfirm: () => void; unreadable?: boolean };

export function ConfirmDialog({ open, onClose, onConfirm, unreadable = false }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (open && !ref.current?.open) ref.current?.showModal(); if (!open) ref.current?.close(); }, [open]);
  return <dialog ref={ref} className="confirm-dialog" aria-labelledby="confirm-title" aria-describedby="confirm-description" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className="dialog-header"><span className="dialog-icon"><AlertTriangle size={22} /></span><button className="icon-button" aria-label="关闭确认框" onClick={onClose}><X size={20} /></button></div><h2 id="confirm-title">清空当前草稿？</h2><p id="confirm-description">已选标签和自定义内容将被清空，排除提示词恢复默认。{unreadable ? '当前本地原草稿无法读取，确认后将覆盖原数据；撤销只能还原当前页面可用的内容，不能找回无法读取的原数据。' : '可在本次会话通过“撤销”恢复，刷新后撤销记录消失。'}</p><div className="dialog-actions"><button autoFocus className="secondary-button" onClick={onClose}>保留草稿</button><button className="danger-button" onClick={onConfirm}>确认清空</button></div></dialog>;
}
