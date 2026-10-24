import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { getPaginationItems, parsePageTarget } from '../lib/pagination';

export function TagPagination({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (page: number) => void }) {
  const [target, setTarget] = useState(String(page));
  const [error, setError] = useState('');
  const targetId = useId(); const errorId = useId();
  useEffect(() => { setTarget(String(page)); setError(''); }, [page, pageCount]);
  function goTo(value: number) { setError(''); setTarget(String(value)); onPage(value); }
  return <nav className="tag-pagination" aria-label="标签分页">
    <div className="pagination-controls">
      <button type="button" disabled={page === 1} onClick={() => goTo(page - 1)}><ChevronLeft size={15} />上一页</button>
      <div className="pagination-pages">{getPaginationItems(page, pageCount).map((item, index) => item === '…'
        ? <span key={`gap-${index}`} className="pagination-ellipsis" aria-hidden="true">…</span>
        : <button key={item} type="button" aria-label={`前往第 ${item} 页`} aria-current={item === page ? 'page' : undefined} onClick={() => goTo(item)}>{item.toLocaleString()}</button>)}</div>
      <button type="button" disabled={page === pageCount} onClick={() => goTo(page + 1)}>下一页<ChevronRight size={15} /></button>
    </div>
    <div className="pagination-footer">
      <span className="pagination-status" aria-live="polite">第 {page.toLocaleString()} / {pageCount.toLocaleString()} 页 · 每页 60 条</span>
      <form className="pagination-jump" onSubmit={event => {
        event.preventDefault(); const value = parsePageTarget(target, pageCount);
        if (value === null) { setError(`请输入 1–${pageCount.toLocaleString()} 之间的整数页码。`); return; }
        goTo(value);
      }}>
        <label htmlFor={targetId}>跳转到</label>
        <input id={targetId} aria-label="跳转页码" type="text" inputMode="numeric" autoComplete="off" value={target} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} onChange={event => { setTarget(event.target.value); setError(''); }} />
        <span>页</span><button type="submit">前往</button>
      </form>
    </div>
    {error && <p id={errorId} className="library-field-error" role="alert">{error}</p>}
  </nav>;
}
