import { BookUser, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { categories } from '../data/sampleTags';
import { LibraryDialog } from './LibraryDialog';
import type { PersonalController } from '../hooks/usePersonalTags';
import { getPersonalEditingInput, personalTagToTag } from '../lib/personalTags';
import type { PersonalTagDeletionImpact } from '../lib/deletePersonalTag';
import type { Tag, TagCategory } from '../types';

type Props = {
  personal: PersonalController;
  baseById: ReadonlyMap<string, Tag>;
  byId: ReadonlyMap<string, Tag>;
  initialTag: Tag | 'new' | null;
  onDelete: (id: string) => void;
  deletionImpact: (id: string) => PersonalTagDeletionImpact;
  onClose: () => void;
};

export function PersonalTagsDialog({ personal, baseById, byId, initialTag, onDelete, deletionImpact, onClose }: Props) {
  const [editing, setEditing] = useState<Tag | 'new' | null>(initialTag);
  const [input, setInput] = useState(() => getPersonalEditingInput(initialTag === 'new' ? null : initialTag, personal.preferences));
  const [aliases, setAliases] = useState(() => getPersonalEditingInput(initialTag === 'new' ? null : initialTag, personal.preferences).aliases.join('，'));
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const native = editing && editing !== 'new' && !editing.id.startsWith('user:');
  const deleting = personal.preferences.tags.find(tag => tag.id === deletingId);
  const impact = deleting ? deletionImpact(deleting.id) : null;
  const overrides = Object.entries(personal.preferences.overrides);
  const wasArchived = editing && editing !== 'new' && personal.preferences.tags.some(tag => tag.id === editing.id && tag.archived);

  function start(tag: Tag | 'new') {
    const fields = getPersonalEditingInput(tag === 'new' ? null : tag, personal.preferences);
    setEditing(tag); setInput(fields); setAliases(fields.aliases.join('，')); setError('');
  }
  function action(run: () => void) {
    try { run(); setError(''); } catch (cause) { setError(cause instanceof Error ? cause.message : '操作失败。'); }
  }

  return <LibraryDialog title="个人标签库" className="personal-dialog" closeLabel="关闭个人标签库" onClose={onClose}>
    <p>直接管理自己的中英文标签。这里显示全部自定义标签，不受搜索条件或屏蔽设置影响。</p>
    {personal.error && <div className="personal-error" role="alert"><p>{personal.error}{personal.blocked && ' 原文保留，暂停编辑与自动写入。'}</p><button className="secondary-button" onClick={personal.blocked ? personal.reload : personal.retry}>{personal.blocked ? '重新读取个人标签' : '重试保存个人标签'}</button></div>}
    {deleting && impact ? <section className="personal-delete" aria-labelledby="personal-delete-title">
      <h3 id="personal-delete-title"><Trash2 size={17} />删除「{deleting.zh}」？</h3>
      <p>将永久删除这个自定义标签，不能通过草稿撤销恢复。</p>
      {(impact.selected || impact.folders || impact.chunks) ? <p>同时从{[impact.selected ? '当前草稿' : '', impact.folders ? `${impact.folders} 个收藏夹的单标签收藏` : '', impact.chunks ? `${impact.chunks} 个标签组合` : ''].filter(Boolean).join('、')}中移除这个标签，其他标签的顺序和权重保留。{impact.emptyChunks > 0 && `其中 ${impact.emptyChunks} 个组合删除后为空，将一并删除。`}</p> : <p>这个标签未被当前草稿或收藏引用。</p>}
      {error && <p className="library-field-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="button" autoFocus className="secondary-button" onClick={() => { setDeletingId(null); setError(''); }}>取消删除</button><button type="button" className="primary-button personal-delete-confirm" disabled={personal.blocked} onClick={() => action(() => { onDelete(deleting.id); setDeletingId(null); })}>确认删除</button></div>
    </section> : editing ? <form className="personal-form" onSubmit={event => {
      event.preventDefault(); action(() => {
        const value = { ...input, aliases: aliases.split(/[,，\r\n]+/).map(alias => alias.trim()).filter(Boolean) };
        if (native) {
          const original = baseById.get(editing.id);
          if (!original) throw new Error('原词条尚未加载，请等待词库就绪后再修改。');
          personal.override(original, value);
        } else personal.save(editing === 'new' ? `user:${crypto.randomUUID()}` : editing.id, value, baseById.values());
        setEditing(null);
      });
    }}>
      <div className="personal-editor-heading"><h3><Pencil size={17} />{native ? '编辑个人修正' : editing === 'new' ? '新增个人标签' : '编辑个人标签'}</h3><button type="button" className="text-button" onClick={() => { setEditing(null); setError(''); }}>返回列表</button></div>
      <label>中文名称<input autoFocus aria-label="中文名称" maxLength={100} value={input.zh} onChange={event => setInput({ ...input, zh: event.target.value })} placeholder="例如：柔和月光" required /></label>
      <label>英文标签<input aria-label="英文标签" maxLength={200} value={input.en} readOnly={Boolean(native)} onChange={event => setInput({ ...input, en: event.target.value })} placeholder="例如：soft moonlight" required spellCheck={false} /></label>
      <p className="personal-hint">{native ? '英文原名保持不变，支持恢复原译名。' : '填写单个英文标签，不添加逗号或权重语法。编辑后，已选标签与收藏组合会同步使用更新的名称。'}{wasArchived && ' 此标签以前已归档，保存后会恢复到标签库。'}</p>
      <label>标签分类<select aria-label="标签分类" value={input.category} onChange={event => setInput({ ...input, category: event.target.value as TagCategory })}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <details className="personal-extra"><summary>别名（可选）</summary><label>标签别名<textarea aria-label="标签别名" value={aliases} onChange={event => setAliases(event.target.value)} placeholder="多个别名用逗号或换行分隔" rows={2} /></label>{native && <p className="personal-hint">原词库别名仍然有效，这里只填写你新增的别名。</p>}</details>
      {error && <p className="library-field-error" role="alert">{error}</p>}
      <div className="personal-form-actions"><button type="submit" className="primary-button" disabled={personal.blocked}>{native ? '保存个人修正' : '保存个人标签'}</button>{native && Object.hasOwn(personal.preferences.overrides, editing.id) && <button type="button" className="secondary-button" disabled={personal.blocked} onClick={() => action(() => { personal.reset(editing.id); setEditing(null); })}><RotateCcw size={15} />恢复原文</button>}</div>
    </form> : <>
      <div className="personal-toolbar"><h3><BookUser size={17} />我的标签 <span className="personal-count">{personal.preferences.tags.length}</span></h3><button className="secondary-button" disabled={personal.blocked} onClick={() => start('new')}><Plus size={16} />新增个人标签</button></div>
      <ul className="personal-list" aria-label="自定义标签列表">{personal.preferences.tags.map(tag => <li key={tag.id}>
        <div><strong>{tag.zh}</strong><span>{tag.en}</span><small>{categories.find(category => category.id === tag.category)?.name}{tag.archived && ' · 旧归档，编辑保存即可恢复'}</small></div>
        <div className="personal-row-actions"><button disabled={personal.blocked} aria-label={`编辑「${tag.zh}」`} onClick={() => start(personalTagToTag(tag))}><Pencil size={15} />编辑</button><button className="personal-delete-button" disabled={personal.blocked} aria-label={`删除「${tag.zh}」`} onClick={() => { setDeletingId(tag.id); setError(''); }}><Trash2 size={15} />删除</button></div>
      </li>)}</ul>
      {!personal.preferences.tags.length && <p className="personal-empty">还没有自定义标签，点击「新增个人标签」开始创建。</p>}
      {overrides.length > 0 && <details className="personal-overrides"><summary>内置标签修正（{overrides.length}）</summary><ul className="personal-list">{overrides.map(([id, value]) => <li key={id}><div><strong>{value.zh}</strong><span>{baseById.get(id)?.en ?? (id.startsWith('db:') ? id.slice(3) : id)}</span></div><div className="personal-row-actions"><button disabled={personal.blocked} aria-label={`编辑修正「${value.zh}」`} onClick={() => { const tag = byId.get(id); if (tag) start(tag); else setError('请等待原词条加载后再编辑。'); }}><Pencil size={15} />编辑</button><button disabled={personal.blocked} aria-label={`恢复「${value.zh}」原文`} onClick={() => action(() => personal.reset(id))}><RotateCcw size={15} />原文</button></div></li>)}</ul></details>}
      {error && <p className="library-field-error" role="alert">{error}</p>}
    </>}
  </LibraryDialog>;
}
