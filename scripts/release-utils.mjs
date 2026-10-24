import { createHash } from 'node:crypto';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

// Explicit inclusion keeps local plans, downloaded tools, browser exports and work notes private.
export const RELEASE_ENTRIES = [
  '.github', '.editorconfig', '.gitattributes', '.gitignore', '.nvmrc',
  'LICENSE', 'README.md', 'THIRD_PARTY_NOTICES.txt', 'CONTRIBUTING.md', 'SECURITY.md', 'CHANGELOG.md',
  'package.json', 'package-lock.json', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.js', 'run-npm.ps1',
  'src', 'scripts', 'public/favicon.svg', 'public/licenses',
  'public/catalog/danbooru-tags.json', 'public/catalog/manifest.json', 'public/catalog/simple-sort-v1.bin',
  'public/catalog/work-media-review.json', 'public/catalog/anime-offline-database-license.txt',
  'docs/DEPLOYMENT.md', 'docs/DATA_SOURCES.md', 'docs/PRIVACY.md', 'docs/RELEASING.md', 'docs/licenses',
];

export function validateReleasePath(path) {
  if (!path || path.includes('\\') || path.startsWith('/') || /^[a-z]:/i.test(path) || path.split('/').some(part => ['..', '.', '.tools', '.git', 'node_modules', 'dist', '.codex', '.agents', 'release'].includes(part)) || /(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|sqlite3?|db|zip|log)$|(?:^|\/)[^/]*(?:backup|export)[^/]*\.json$/i.test(path)) throw new Error(`发布范围包含本地或私密文件：${path}`);
}

export function checkPublicContent(path, text) {
  if (/\b[A-Z]:[\\/]Users[\\/]/i.test(text)) throw new Error(`发布文件包含本机用户目录：${path}`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{30,}|\bgithub_pat_[A-Za-z0-9_]{40,}|\bsk-proj-[A-Za-z0-9_-]{30,}|\bAKIA[A-Z0-9]{16}\b/.test(text)) throw new Error(`发布文件包含疑似凭证：${path}（内容未输出）`);
}

export async function collectReleaseFiles(root, entries = RELEASE_ENTRIES) {
  const files = [];
  async function visit(path) {
    validateReleasePath(path);
    const absolute = join(root, path), stat = await lstat(absolute);
    if (stat.isSymbolicLink()) throw new Error(`发布不接受符号链接：${path}`);
    if (stat.isDirectory()) { for (const name of (await readdir(absolute)).sort()) await visit(`${path}/${name}`); return; }
    if (!stat.isFile() || stat.size > 90 * 1024 * 1024) throw new Error(`文件类型或大小不适合发布：${path}`);
    const content = await readFile(absolute);
    if (!path.endsWith('.bin')) checkPublicContent(path, content.toString('utf8'));
    files.push({ path, bytes: stat.size, sha256: createHash('sha256').update(content).digest('hex') });
  }
  for (const entry of entries) await visit(entry);
  return files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}
