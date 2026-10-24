import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

export function LibraryDialog({ title, onClose, children, className = '', closeLabel = '关闭收藏与筛选对话框' }: { title: string; onClose: () => void; children: ReactNode; className?: string; closeLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (trigger?.isConnected) trigger.focus();
      else document.querySelector<HTMLButtonElement>('.library-scope button')?.focus();
    };
  }, []);
  return <dialog ref={ref} className={`confirm-dialog library-dialog ${className}`} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
    }}>
    <div className="dialog-header"><h2 id={titleId}>{title}</h2><button type="button" className="icon-button" aria-label={closeLabel} onClick={onClose}><X size={20} /></button></div>
    {children}
  </dialog>;
}
