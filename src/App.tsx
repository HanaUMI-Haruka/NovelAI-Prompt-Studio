import { ArchiveRestore, Check, CheckCheck, ChevronRight, CircleAlert, FileText, Grid2X2, HardDrive, ListFilter, Palette, Save, Sparkles, Trash2, X } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PromptOutput } from './components/PromptOutput';
import { Sidebar } from './components/Sidebar';
import { TagLibrary } from './components/TagLibrary';
import { useDraft } from './hooks/useDraft';
import { useTagCatalog } from './hooks/useTagCatalog';
import { buildPrompt, moveSelectedTag } from './lib/prompt';
import { hasNovelAiSyntaxConflict, toNovelAiTag } from './lib/novelai';
import type { LibraryScope, MobileView, Tag, TagCategory } from './types';
import { AppearanceSettings } from './components/AppearanceSettings';
import { useAppearance } from './hooks/useAppearance';
import type { AppearanceState } from './lib/appearance';
import { useLibraryPreferences } from './hooks/useLibraryPreferences';
import { SavePromptChunkDialog } from './components/SavePromptChunkDialog';
import { appendPromptChunk } from './lib/promptChunks';
import type { PromptChunk } from './lib/promptChunks';
import { DraftHistoryControls } from './components/DraftHistoryControls';
import { useSortPreferences } from './hooks/useSortPreferences';
import { commitRestore, planRestore } from './lib/backup';
import type { BackupFile, RestoreOptions } from './lib/backup';
import { usePersonalTags } from './hooks/usePersonalTags';
import { getPersonalTagDeletionImpact, planPersonalTagDeletion } from './lib/deletePersonalTag';
import { personalTagToTag } from './lib/personalTags';

const SelectedTags = lazy(() => import('./components/SelectedTags').then(module => ({ default: module.SelectedTags })));
const BackupDialog = lazy(() => import('./components/BackupDialog').then(module => ({ default: module.BackupDialog })));
const PersonalTagsDialog = lazy(() => import('./components/PersonalTagsDialog').then(module => ({ default: module.PersonalTagsDialog })));

export default function App({ initialAppearance }: { initialAppearance: AppearanceState }) {
  const appearance = useAppearance(initialAppearance);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { draft, update, clear, error, blocked, savedAt, save, canUndo, canRedo, undo, redo, restore, forgetTag } = useDraft();
  const sort = useSortPreferences();
  const [backupOpen, setBackupOpen] = useState(false);
  const personal = usePersonalTags();
  const catalog = useTagCatalog(personal.preferences);
  const [personalOpen, setPersonalOpen] = useState(false);
  const [personalEditing, setPersonalEditing] = useState<Tag | 'new' | null>(null);
  const personalTags = useMemo(() => personal.preferences.tags.map(personalTagToTag), [personal.preferences.tags]);
  const savedLibrary = useLibraryPreferences();
  const [chunkSaveOpen, setChunkSaveOpen] = useState(false);
  const [category, setCategory] = useState<TagCategory | 'all'>('all');
  const [libraryScope, setLibraryScope] = useState<LibraryScope>('all');
  const [view, setView] = useState<MobileView>('library');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<{ message: string; time: number } | null>(null);
  const selected = draft.selectedTagIds.map(id => catalog.byId.get(id) ?? (id.startsWith('db:') ? { id, zh: id.slice(3), en: toNovelAiTag(id.slice(3)), category: 'general' as const } : id.startsWith('user:') ? { id, zh: '个人标签定义未就绪', en: '', category: 'general' as const } : undefined)).filter((tag): tag is Tag => Boolean(tag));
  const copyBlocked = selected.some(tag => !draft.disabledTagIds?.includes(tag.id) && (hasNovelAiSyntaxConflict(tag.en) || !tag.en));
  const prompt = buildPrompt(draft.selectedTagIds, draft.customPositive, selected, draft.tagWeights, draft.disabledTagIds);
  const openPersonal = (tag: Tag | 'new' | null = null) => { setPersonalEditing(tag); setPersonalOpen(true); };
  function changeLibraryScope(scope: LibraryScope) { setLibraryScope(scope); setCategory('all'); setView('library'); }
  const notify = (message: string) => setNotice({ message, time: Date.now() });
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 6000); return () => window.clearTimeout(timer); }, [notice]);
  function toggle(id: string) {
    if (draft.selectedTagIds.includes(id)) remove(id);
    else update({ selectedTagIds: [...draft.selectedTagIds, id] });
  }
  function remove(id: string) {
    const weights = { ...draft.tagWeights }; delete weights[id];
    update({ selectedTagIds: draft.selectedTagIds.filter(value => value !== id), tagWeights: weights, disabledTagIds: draft.disabledTagIds?.filter(value => value !== id) });
  }
  function toggleDisabled(id: string) {
    const disabled = new Set(draft.disabledTagIds ?? []);
    if (disabled.has(id)) disabled.delete(id); else disabled.add(id);
    update({ disabledTagIds: draft.selectedTagIds.filter(value => disabled.has(value)) });
  }
  function setWeight(id: string, value: number) {
    const weights = { ...draft.tagWeights };
    if (value === 1) delete weights[id]; else weights[id] = value;
    update({ tagWeights: weights }, `weight:${id}`);
  }
  function moveTag(activeId: string, overId: string | null) {
    const ids = moveSelectedTag(draft.selectedTagIds, activeId, overId);
    if (ids !== draft.selectedTagIds) update({ selectedTagIds: ids });
  }
  function useChunk(chunk: PromptChunk) {
    if (chunk.selectedTagIds.some(id => !catalog.byId.has(id) && !id.startsWith('db:'))) {
      notify('组合含暂时无法识别的标签，请等待词库就绪后重试；原组合已保留。'); return;
    }
    const patch = appendPromptChunk(draft, chunk);
    const added = patch.selectedTagIds.length - draft.selectedTagIds.length;
    if (added) update(patch);
    setView('selected');
    notify(added ? `已追加「${chunk.name}」中的 ${added} 个新标签，已有标签及权重保持。` : '这些标签已经全部选中，当前顺序和权重保持。');
  }

  const backupData = { draft, library: savedLibrary.preferences, theme: appearance.theme, sort: sort.settings, personal: personal.preferences };
  function deletePersonalTag(id: string) {
    if (personal.blocked || blocked || savedLibrary.blocked) throw new Error('部分本地数据尚未读取成功，暂不能安全删除标签。请先处理页面中的数据读取提示。');
    const next = { ...backupData, ...planPersonalTagDeletion(backupData, id) };
    commitRestore(next, { mode: 'replace', restoreDraft: true, restoreSettings: false, restorePersonal: true }, localStorage, '删除标签');
    personal.restore(next.personal);
    savedLibrary.restore(next.library);
    forgetTag(id, next.draft);
    notify('自定义标签已删除，草稿、收藏及组合中的引用已同步清理。');
  }
  function restoreBackup(file: BackupFile, options: RestoreOptions) {
    if (options.mode === 'merge' && savedLibrary.blocked) throw new Error('原收藏暂不可读取，不能安全合并，请先重新读取或明确选择替换收藏。');
    if (personal.blocked && file.data.personal && (options.mode !== 'replace' || !options.restoreDraft)) throw new Error('个人标签原数据无法读取，请先重新读取；如需用备份重新开始，请选择替换收藏并恢复备份草稿，再确认覆盖。');
    const next = planRestore(backupData, file.data, options);
    commitRestore(next, { ...options, restorePersonal: Boolean(file.data.personal) });
    savedLibrary.restore(next.library);
    if (file.data.personal && next.personal) personal.restore(next.personal);
    if (options.restoreDraft) restore(next.draft);
    if (options.restoreSettings) { appearance.restore(next.theme); sort.restore(next.sort); }
    setBackupOpen(false);
    notify(options.restoreDraft ? '备份已恢复并保存。草稿替换可在本次会话撤销，收藏与设置不参与撤销。' : '备份收藏已恢复并保存，当前草稿保持。');
  }

  return <div className="app-shell">
    <a href="#main" className="skip-link">跳到主内容</a>
    <Sidebar category={category} onCategory={value => { setLibraryScope('all'); setCategory(value); setView('library'); }} onFavorites={() => changeLibraryScope('favorites')} scope={libraryScope} onInfo={notify} counts={catalog.counts} total={catalog.tags.length} onAppearance={() => setAppearanceOpen(true)} onBackup={() => setBackupOpen(true)} onPersonal={() => changeLibraryScope('personal')} />
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span className="mobile-logo"><Sparkles size={19} /></span><span className="desktop-crumb">我的创作空间<ChevronRight size={14} /></span><strong>提示词编辑器</strong><span className="version-badge">v0.1.0</span></div><div className="topbar-actions"><span className="privacy-badge"><HardDrive size={14} />浏览器本地保存</span><span className={`save-status ${error ? 'has-error' : ''}`} role="status">{error ? <CircleAlert size={14} /> : <CheckCheck size={15} />}{error ? '未保存' : savedAt ? '草稿已保存' : '正在保存'}</span><button className="appearance-button backup-button" aria-label="本地备份与恢复" title="本地备份与恢复" onClick={() => setBackupOpen(true)}><ArchiveRestore size={17} /><span>备份恢复</span></button><button className="appearance-button" aria-label="外观设置" title="外观设置" onClick={() => setAppearanceOpen(true)}><Palette size={17} /><span>外观设置</span></button><button className="save-button" onClick={() => { if (save()) notify('草稿已保存到当前浏览器'); else notify(blocked ? '旧草稿未被覆盖。如需重新开始，请使用「清空草稿」并确认。' : '保存失败，请查看页面提示。'); }}><Save size={15} /><span>保存草稿</span></button></div></header>
      {error && <div className="storage-alert" role="alert"><CircleAlert size={18} /><span>{error}{blocked && ' 原数据未被覆盖。你可以继续临时编辑并复制；确认清空后才能重新保存。'}</span></div>}
      {personal.error && <div className="storage-alert" role="alert"><CircleAlert size={18} /><span>{personal.error}</span><button type="button" onClick={() => openPersonal()}>查看个人标签</button></div>}
      <nav className="mobile-tabs" aria-label="编辑器视图">{([{ id: 'library', label: '标签库', Icon: Grid2X2 }, { id: 'selected', label: `已选标签 ${selected.length}`, Icon: ListFilter }, { id: 'output', label: '输出', Icon: FileText }] as const).map(item => <button key={item.id} aria-pressed={view === item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><item.Icon size={16} />{item.label}</button>)}</nav>
      <main id="main" className="editor-layout">
        <div className={`library-pane ${view === 'library' ? 'mobile-visible' : ''}`}><TagLibrary category={category} onCategory={setCategory} selectedIds={draft.selectedTagIds} onToggle={toggle} tags={catalog.tags} byId={catalog.byId} savedLibrary={savedLibrary} onUseChunk={useChunk} sortIndex={catalog.sortIndex} sortIndexError={catalog.sortIndexError} status={catalog.status} onRetry={catalog.retry} snapshotDate={catalog.snapshotDate} scope={libraryScope} onScope={changeLibraryScope} sort={sort} sortOverlay={catalog.sortOverlay} personalTags={personalTags} onCreatePersonal={() => openPersonal('new')} onPersonal={() => openPersonal()} onEditTag={tag => openPersonal(tag)} /></div>
        <aside className={`composer-pane ${view !== 'library' ? 'mobile-visible' : ''}`} aria-label="Prompt 编辑区域"><div className="composer-header"><span className="composer-icon"><Sparkles size={19} /></span><div><h2>灵感画布</h2><p>把想象，整理成语言</p></div><span className="status-dot" /></div>
          <DraftHistoryControls canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
          <div className={`selected-pane ${view === 'selected' ? 'mobile-visible' : ''}`}><Suspense fallback={<p className="weight-help" role="status">正在准备已选标签编辑器…</p>}><SelectedTags selected={selected} customPositive={draft.customPositive} weights={draft.tagWeights} onWeight={setWeight} onRemove={remove} onMove={moveTag} onChange={update} onSaveChunk={() => setChunkSaveOpen(true)} favoritesBlocked={savedLibrary.blocked} favoritesError={savedLibrary.error} onRetryFavorites={savedLibrary.retry} disabledIds={draft.disabledTagIds ?? []} onToggleDisabled={toggleDisabled} /></Suspense></div>
          <div className={`output-pane ${view === 'output' ? 'mobile-visible' : ''}`}><PromptOutput prompt={prompt} negativePrompt={draft.negativePrompt} onChange={update} onInfo={notify} copyBlocked={copyBlocked} /></div>
          <footer className="composer-footer"><span><HardDrive size={13} />自动保存到当前浏览器</span><button onClick={() => setConfirmOpen(true)}><Trash2 size={14} />清空草稿</button></footer>
        </aside>
      </main>
    </div>
    {appearanceOpen && <AppearanceSettings theme={appearance.theme} onSelect={appearance.select} error={appearance.error} onRetry={appearance.retry} onClose={() => setAppearanceOpen(false)} />}
    {personalOpen && <Suspense fallback={<p className="storage-alert" role="status">正在准备个人标签库…</p>}><PersonalTagsDialog personal={personal} baseById={catalog.baseById} byId={catalog.byId} initialTag={personalEditing} onDelete={deletePersonalTag} deletionImpact={id => getPersonalTagDeletionImpact(backupData, id)} onClose={() => setPersonalOpen(false)} /></Suspense>}
    {backupOpen && <Suspense fallback={<p className="storage-alert" role="status">正在准备本地备份工具…</p>}><BackupDialog current={backupData} exportBlocked={blocked || savedLibrary.blocked || personal.blocked} mergeBlocked={savedLibrary.blocked} personalBlocked={personal.blocked} onRestore={restoreBackup} onClose={() => setBackupOpen(false)} /></Suspense>}
    {chunkSaveOpen && <SavePromptChunkDialog folders={savedLibrary.preferences.folders} ids={draft.selectedTagIds} weights={draft.tagWeights} disabledIds={draft.disabledTagIds} byId={catalog.byId} onCreate={savedLibrary.createFolder} onSave={(folderId, name) => {
      savedLibrary.saveChunk(folderId, name, draft.selectedTagIds, draft.tagWeights, draft.disabledTagIds);
      setChunkSaveOpen(false); notify(`「${name.trim()}」已加入收藏夹。`);
    }} onClose={() => setChunkSaveOpen(false)} disabled={savedLibrary.blocked} error={savedLibrary.error} />}
    <ConfirmDialog open={confirmOpen} unreadable={blocked} onClose={() => setConfirmOpen(false)} onConfirm={() => { clear(); setConfirmOpen(false); notify('当前草稿已清空，排除提示词已恢复默认；可在本次会话撤销。'); }} />
    <div className="toast-region" aria-live="polite" aria-atomic="true">{notice && <div className="toast"><Check size={18} /><span>{notice.message}</span><button aria-label="关闭提示" onClick={() => setNotice(null)}><X size={16} /></button></div>}</div>
  </div>;
}
