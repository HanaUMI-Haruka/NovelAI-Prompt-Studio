import { afterEach, expect, it } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectReleaseFiles, checkPublicContent, validateReleasePath } from './release-utils.mjs';

const temporary = [];
afterEach(async () => { for (const path of temporary.splice(0)) await rm(path, { recursive: true, force: true }); });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'prompt-studio-release-')); temporary.push(root);
  await mkdir(join(root, 'src')); await mkdir(join(root, '.tools'));
  await writeFile(join(root, 'README.md'), 'Public readme'); await writeFile(join(root, 'src', 'app.ts'), 'export const example = true;'); await writeFile(join(root, '.tools', 'private.json'), 'local development data');
  return root;
}
it('发布只收集明确列出的源码，自动排除本地开发资料', async () => {
  const files = await collectReleaseFiles(await fixture(), ['README.md', 'src']);
  expect(files.map(file => file.path)).toEqual(['README.md', 'src/app.ts']);
  expect(files.every(file => file.sha256.length === 64)).toBe(true);
});
it('缺少必需文件时停止发布，不能生成不完整源码包', async () => {
  await expect(collectReleaseFiles(await fixture(), ['LICENSE'])).rejects.toThrow(/LICENSE/);
});
it('源码目录内混入环境文件时停止发布', async () => {
  const root = await fixture(); await writeFile(join(root, 'src', '.env.local'), 'private');
  await expect(collectReleaseFiles(root, ['src'])).rejects.toThrow(/私密|本地/);
});
it('拒绝绝对路径、父目录跳转、密钥文件和用户备份', () => {
  for (const name of ['../outside', '/outside', 'C:/outside', 'src/.env', 'src/key.pem', '.tools/result.json', 'public/user-backup.json']) expect(() => validateReleasePath(name)).toThrow();
  expect(() => validateReleasePath('.github/workflows/ci.yml')).not.toThrow();
});
it('发现高置信度凭证时只报告文件名，不回显密钥', () => {
  const token = 'ghp_' + 'x'.repeat(36);
  let message = ''; try { checkPublicContent('src/example.ts', token); } catch (error) { message = error.message; }
  expect(message).toContain('src/example.ts'); expect(message).not.toContain(token);
  expect(() => checkPublicContent('src/example.ts', '-----BEGIN ' + 'PRIVATE KEY-----')).toThrow();
});
it('拒绝机器用户目录泄露，允许公开上游版权声明', () => {
  expect(() => checkPublicContent('README.md', ['C:', 'Users', 'someone', 'project'].join('/'))).toThrow(/本机/);
  expect(() => checkPublicContent('NOTICE', 'Copyright 2026 Example Contributors <public@example.com>')).not.toThrow();
});
