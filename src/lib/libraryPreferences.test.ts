import { expect, it } from 'vitest';
import { addFavoriteFolder, createLibraryPreferences, deleteFavoriteFolder, getFavoriteTagIds, matchesUsageThreshold, parseLibraryPreferences, parseUsageThreshold, renameFavoriteFolder, resolveFavoriteFolderId, setFolderMembership } from './libraryPreferences';

it('恢复替换后失效收藏夹范围立即回到全部，范围和下拉显示一致', () => {
  const folders = createLibraryPreferences().folders;
  expect(resolveFavoriteFolderId(folders, 'removed')).toBe('all');
  expect(resolveFavoriteFolderId(folders, 'all')).toBe('all');
  expect(resolveFavoriteFolderId(folders, 'default')).toBe('default');
  expect(resolveFavoriteFolderId([], 'default')).toBe('all');
});

it('门槛包含边界值，开启后隐藏低频和未知引用，关闭后全部保留', () => {
  const settings = { enabled: true, minimum: 1000 };
  expect([999, 1000, 1001, undefined, -1, Infinity].map(postCount => matchesUsageThreshold({ postCount }, settings))).toEqual([false, true, true, false, false, false]);
  expect(matchesUsageThreshold({}, { ...settings, enabled: false })).toBe(true);
  expect(matchesUsageThreshold({ postCount: 0 }, { enabled: true, minimum: 0 })).toBe(true);
});
it('手动门槛仅接受非负安全整数，不将空白、小数和负数当有效输入', () => {
  expect(['0', ' 100 ', '1000', '10000', '', ' ', '-1', '1.5', '1e3', 'NaN', '9007199254740992'].map(parseUsageThreshold)).toEqual([0, 100, 1000, 10000, null, null, null, null, null, null, null]);
});
it('新浏览器默认不屏蔽，并提供可使用的默认收藏夹', () => {
  const result = parseLibraryPreferences(null);
  expect(result.error).toBeNull();
  expect(result.preferences?.usage).toEqual({ enabled: false, minimum: 1000 });
  expect(result.preferences?.folders.map(folder => folder.name)).toEqual(['默认收藏']);
});
it('新建与重命名清理空格，不允许空名称、超长和同名', () => {
  const initial = createLibraryPreferences();
  const added = addFavoriteFolder(initial, 'a', '  角色  ');
  expect(added.folders[1]).toEqual({ id: 'a', name: '角色', tagIds: [], chunks: [] });
  expect(renameFavoriteFolder(added, 'a', '  人物  ').folders[1].name).toBe('人物');
  expect(() => addFavoriteFolder(added, 'b', '角色')).toThrow();
  expect(() => renameFavoriteFolder(added, 'a', '默认收藏')).toThrow();
  expect(() => addFavoriteFolder(added, 'b', ' ')).toThrow();
  expect(() => renameFavoriteFolder(added, 'a', '字'.repeat(41))).toThrow();
  expect(initial.folders).toHaveLength(1);
});
it('同标签可存多个收藏夹，重复添加去重，取消仅影响指定文件夹', () => {
  let value = addFavoriteFolder(createLibraryPreferences(), 'a', '人物');
  value = setFolderMembership(value, 'default', 'db:silver_hair', true);
  value = setFolderMembership(value, 'a', 'db:silver_hair', true);
  value = setFolderMembership(value, 'a', 'db:silver_hair', true);
  expect(value.folders[1].tagIds).toEqual(['db:silver_hair']);
  value = setFolderMembership(value, 'a', 'db:silver_hair', false);
  expect([...getFavoriteTagIds(value.folders, 'all')]).toEqual(['db:silver_hair']);
  expect([...getFavoriteTagIds(value.folders, 'a')]).toEqual([]);
});
it('删除收藏夹不会改变其他归属、引用设置或传入对象，可删除最后一个文件夹', () => {
  let value = addFavoriteFolder(createLibraryPreferences(), 'a', '人物');
  value = setFolderMembership(value, 'default', 'x', true);
  value = setFolderMembership(value, 'a', 'x', true);
  const deleted = deleteFavoriteFolder(value, 'default');
  expect([...getFavoriteTagIds(deleted.folders, 'all')]).toEqual(['x']);
  expect(deleted.usage).toEqual(value.usage);
  expect(value.folders).toHaveLength(2);
  expect(deleteFavoriteFolder(deleted, 'a').folders).toEqual([]);
});
it('序列化后可恢复归属与门槛，未知标签ID保留，重复ID去重', () => {
  const preferences = createLibraryPreferences();
  preferences.usage = { enabled: true, minimum: 10000 };
  preferences.folders[0].tagIds = ['db:unknown_future_tag', 'hair-silver', 'hair-silver'];
  const parsed = parseLibraryPreferences(JSON.stringify(preferences));
  expect(parsed.error).toBeNull();
  expect(parsed.preferences?.usage).toEqual({ enabled: true, minimum: 10000 });
  expect(parsed.preferences?.folders[0].tagIds).toEqual(['db:unknown_future_tag', 'hair-silver']);
});
it.each([
  '{broken',
  JSON.stringify({ ...createLibraryPreferences(), version: 3 }),
  JSON.stringify({ ...createLibraryPreferences(), usage: { enabled: true, minimum: -1 } }),
  JSON.stringify({ ...createLibraryPreferences(), usage: { enabled: true, minimum: 1.5 } }),
  JSON.stringify({ ...createLibraryPreferences(), folders: [{ id: 'x', name: '  ', tagIds: [] }] }),
  JSON.stringify({ ...createLibraryPreferences(), folders: [{ id: 'x', name: '一', tagIds: [123] }] }),
  JSON.stringify({ ...createLibraryPreferences(), folders: [{ id: 'x', name: '一', tagIds: [] }, { id: 'x', name: '二', tagIds: [] }] }),
])('拒绝损坏或未来版本，不以默认数据覆盖：%s', raw => {
  const parsed = parseLibraryPreferences(raw);
  expect(parsed.preferences).toBeNull();
  expect(parsed.error).toBeTruthy();
});

it('版本1旧收藏迁移到版本2，保留门槛、文件夹和未知标签归属', () => {
  const old = { version: 1, usage: { enabled: true, minimum: 10000 }, folders: [{ id: 'a', name: '旧收藏', tagIds: ['hair-silver', 'db:future_tag'] }] };
  const parsed = parseLibraryPreferences(JSON.stringify(old));
  expect(parsed.error).toBeNull();
  expect(parsed.preferences).toEqual({ ...old, version: 2, folders: [{ ...old.folders[0], chunks: [] }] });
});

it('版本2序列化往返保留组合顺序、0权重和未加载的标签ID', () => {
  const chunk = { id: 'chunk-a', name: '角色设定', selectedTagIds: ['hair-silver', 'db:future_tag'], tagWeights: { 'hair-silver': 0, 'db:future_tag': 1.5 } };
  const value = { version: 2, usage: { enabled: false, minimum: 1000 }, folders: [{ id: 'default', name: '默认收藏', tagIds: [], chunks: [chunk] }] };
  const parsed = parseLibraryPreferences(JSON.stringify(value));
  expect(parsed.error).toBeNull(); expect(parsed.preferences).toEqual(value);
});

it.each([
  undefined,
  [{ id: 'a', name: '组合', selectedTagIds: [], tagWeights: {} }],
  [{ id: 'a', name: '组合', selectedTagIds: ['hair-silver'], tagWeights: { 'hair-silver': -1 } }],
  [{ id: 'a', name: '组合', selectedTagIds: ['hair-silver'], tagWeights: { 'hair-silver': '1.5' } }],
])('版本2组合缺失或损坏时保护整个收藏数据，不静默清空组合：%s', chunks => {
  const raw = { version: 2, usage: { enabled: false, minimum: 1000 }, folders: [{ id: 'a', name: '收藏', tagIds: [], chunks }] };
  const parsed = parseLibraryPreferences(JSON.stringify(raw));
  expect(parsed.preferences).toBeNull(); expect(parsed.error).toBeTruthy();
});
