import { Redo2, Undo2 } from 'lucide-react';
import { HISTORY_LIMIT } from '../lib/draftHistory';

export function DraftHistoryControls({ canUndo, canRedo, onUndo, onRedo }: { canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void }) {
  return <div className="draft-history" role="group" aria-label="草稿撤销与重做">
    <div><button type="button" disabled={!canUndo} onClick={onUndo} aria-label="撤销草稿操作" title="撤销上一次草稿编辑"><Undo2 size={16} />撤销</button><button type="button" disabled={!canRedo} onClick={onRedo} aria-label="重做草稿操作" title="重做已撤销的草稿编辑"><Redo2 size={16} />重做</button></div>
    <span title={`最多${HISTORY_LIMIT}步，连续输入与调权合并记录；刷新后清空历史。收藏和设置不参与撤销。`}>本次会话 · 最多{HISTORY_LIMIT}步</span>
  </div>;
}
