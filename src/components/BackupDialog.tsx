import { Download, FileJson, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { LibraryDialog } from './LibraryDialog';
import { createBackup, MAX_BACKUP_BYTES, parseBackup, planRestore } from '../lib/backup';
import type { BackupData, BackupFile, RestoreOptions } from '../lib/backup';
import { themes } from '../data/themes';
import { getTagSortLabel } from '../lib/tagSorting';

type Props = { current: BackupData; exportBlocked: boolean; mergeBlocked: boolean; personalBlocked?: boolean; onRestore: (file: BackupFile, options: RestoreOptions) => void; onClose: () => void };
const counts = (data: BackupData) => ({ folders: data.library.folders.length, tags: data.library.folders.reduce((n, folder) => n + folder.tagIds.length, 0), chunks: data.library.folders.reduce((n, folder) => n + folder.chunks.length, 0) });

export function BackupDialog({ current, exportBlocked, mergeBlocked, personalBlocked = false, onRestore, onClose }: Props) {
  const [file, setFile] = useState<BackupFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reading, setReading] = useState(false);
  const [options, setOptions] = useState<RestoreOptions>({ mode: 'merge', restoreDraft: false, restoreSettings: false });
  const [confirmed, setConfirmed] = useState(false);
  const request = useRef(0);
  const overwrite = options.mode === 'replace' || options.restoreDraft || options.restoreSettings;
  const preview = useMemo(() => {
    if (!file) return null;
    try { return { data: planRestore(current, file.data, options), error: '' }; }
    catch (cause) { return { data: null, error: cause instanceof Error ? cause.message : '无法预览备份。' }; }
  }, [current, file, options]);
  const personalUnavailable = Boolean(personalBlocked && file?.data.personal && (options.mode !== 'replace' || !options.restoreDraft));
  const unavailable = (options.mode === 'merge' && mergeBlocked) || personalUnavailable;
  function change(patch: Partial<RestoreOptions>) { setOptions(previous => ({ ...previous, ...patch })); setConfirmed(false); setError(''); }
  async function readFile(input: HTMLInputElement) {
    const selected = input.files?.[0];
    if (!selected) return;
    const token = ++request.current;
    setFile(null); setError(''); setMessage(''); setConfirmed(false); setFileName(selected.name); setReading(true);
    try {
      if (selected.size > MAX_BACKUP_BYTES) throw new Error('备份文件超过10 MiB，请使用更小的备份。');
      const parsed = parseBackup(await selected.text());
      if (token === request.current) setFile(parsed);
    } catch (cause) { if (token === request.current) setError(cause instanceof Error ? cause.message : '文件读取失败，请重新选择。'); }
    finally { if (token === request.current) setReading(false); }
  }
  function download() {
    setError('');
    try {
      const value = createBackup(current);
      const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = `ai-prompt-studio-backup-${value.exportedAt.replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('已生成备份文件，请在浏览器下载记录中查看。');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '备份生成失败。'); }
  }
  const source = file && counts(file.data), result = preview?.data && counts(preview.data);
  return <LibraryDialog title="本地备份与恢复" closeLabel="关闭本地备份与恢复" className="backup-dialog" onClose={onClose}>
    <p className="backup-intro">将草稿、收藏夹、标签组合与设置保存成文件，方便换浏览器或恢复使用。文件仅在本地处理，包含你的自定义文本。</p>
    {current.personal && <p className="backup-hint">当前个人词条 {current.personal.tags.length} 个、个人修正 {Object.keys(current.personal.overrides).length} 项，随备份一起保存；已停用标签也会保留状态。</p>}
    <section className="backup-export"><h3><Download size={17} />导出当前数据</h3><p>{counts(current).folders} 个收藏夹 · {counts(current).chunks} 个组合 · {current.draft.selectedTagIds.length} 个已选标签。备份不包含大词库和撤销历史。</p><button className="secondary-button" type="button" disabled={exportBlocked} onClick={download}><Download size={16} />下载JSON备份</button>{exportBlocked && <p className="library-field-error">草稿或收藏原数据尚未读取成功，暂不导出默认内容。请先处理页面中的数据提示。</p>}</section>
    <section className="backup-import"><h3><Upload size={17} />从备份文件恢复</h3><label className="backup-file-label">选择JSON备份文件<input type="file" accept=".json,application/json" aria-label="选择JSON备份文件" onChange={event => { void readFile(event.currentTarget); }} /></label><p className="backup-hint">最大10 MiB。选择文件只生成预览，点击“确认恢复”后才写入。</p>
      {reading && <p role="status">正在读取备份…</p>}
      {file?.data.personal && <div className="backup-result">此备份含 {file.data.personal.tags.length} 个个人词条、{Object.keys(file.data.personal.overrides).length} 项个人修正。个人字典始终合并，现有定义及修正优先；旧备份不会修改个人字典。个人字典不参与草稿撤销。</div>}
      {file && <p className="backup-hint">备份草稿中 {file.data.draft.disabledTagIds?.length ?? 0} 个标签已停用，恢复时仍保持停用。</p>}
      {file && source && <><div className="backup-preview"><h4><FileJson size={16} />{fileName}</h4><p>导出时间：{new Date(file.exportedAt).toLocaleString('zh-CN')}</p><dl><div><dt>收藏夹</dt><dd>{source.folders}</dd></div><div><dt>标签收藏关系</dt><dd>{source.tags}</dd></div><div><dt>标签组合</dt><dd>{source.chunks}</dd></div><div><dt>草稿标签</dt><dd>{file.data.draft.selectedTagIds.length}</dd></div></dl><p>草稿含自定义文本 {file.data.draft.customPositive.length} 字符、排除词 {file.data.draft.negativePrompt.length} 字符。</p><details><summary>预览草稿标签、权重与文本</summary><ol className="backup-draft-tags">{file.data.draft.selectedTagIds.map(id => <li key={id}>{id.startsWith('db:') ? id.slice(3) : id}<span>{file.data.draft.tagWeights[id] ?? 1}×</span></li>)}</ol><p>自定义文本</p><pre>{file.data.draft.customPositive || '（空）'}</pre><p>排除词</p><pre>{file.data.draft.negativePrompt || '（空）'}</pre></details><p>备份设置：{themes.find(theme => theme.id === file.data.theme)?.name} · {getTagSortLabel(file.data.sort.key, file.data.sort.direction)} · {file.data.sort.selectedFirst ? '已选优先' : '常规顺序'} · {file.data.library.usage.enabled ? `屏蔽低于 ${file.data.library.usage.minimum} 次` : '不屏蔽低引用'}。</p></div>
      <fieldset className="backup-options"><legend>收藏恢复方式</legend><label><input type="radio" name="backup-mode" checked={options.mode === 'merge'} onChange={() => change({ mode: 'merge' })} />合并收藏（推荐）</label><p>同名收藏夹合并，标签去重；同名不同内容的组合加“导入”后缀保留。</p><label><input type="radio" name="backup-mode" checked={options.mode === 'replace'} onChange={() => change({ mode: 'replace' })} />替换全部收藏夹与组合</label></fieldset>
      <div className="backup-options"><label><input type="checkbox" checked={options.restoreDraft} onChange={event => change({ restoreDraft: event.target.checked })} />恢复备份草稿（替换当前标签、权重、自定义文本和排除词）</label><label><input type="checkbox" checked={options.restoreSettings} onChange={event => change({ restoreSettings: event.target.checked })} />恢复备份设置（主题、排序、已选优先和引用门槛）</label></div>
      {unavailable && <p className="library-field-error" role="alert">{personalUnavailable ? '个人标签原数据无法读取。可先重新读取；如需用备份重新开始，请选择替换收藏并恢复备份草稿，再确认覆盖个人字典。' : '当前收藏无法读取，不能安全合并。可先重新读取原数据，或明确选择替换收藏。'}</p>}
      {preview?.error && <p className="library-field-error" role="alert">{preview.error}</p>}
      {result && <div className="backup-result" aria-live="polite">恢复后：{result.folders} 个收藏夹、{result.tags} 条标签收藏关系、{result.chunks} 个组合。<br />{options.restoreDraft ? '当前草稿将替换，可在本次会话撤销。' : '保留当前草稿。'}{options.restoreSettings ? '使用备份设置。' : '保留当前设置。'}{options.mode === 'replace' && ' 当前全部收藏将被备份收藏替换。'}</div>}
      {overwrite && <label className="backup-confirm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />我确认覆盖上述选中的当前数据（收藏和设置不支持撤销）</label>}
      <button type="button" className="primary-button" disabled={!preview?.data || unavailable || reading || (overwrite && !confirmed)} onClick={() => { try { onRestore(file, options); } catch (cause) { setError(cause instanceof Error ? cause.message : '恢复失败。'); } }}>确认恢复</button></>}
    </section>
    {message && <p className="backup-message" role="status">{message}</p>}{error && <p className="backup-error" role="alert">{error}</p>}
    <div className="backup-footer"><button type="button" className="secondary-button" onClick={onClose}>关闭</button></div>
  </LibraryDialog>;
}
