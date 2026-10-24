import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'));
const notices = ['Runtime dependency license texts. Generated from the locked, installed packages.\n'];
for (const [path, metadata] of Object.entries(lock.packages)) {
  if (!path || metadata.dev) continue;
  const folder = resolve(root, path), pkg = JSON.parse(await readFile(join(folder, 'package.json'), 'utf8'));
  if (pkg.version !== metadata.version) throw new Error(`依赖与锁文件不一致：${pkg.name}。请先运行npm ci。`);
  const names = (await readdir(folder)).filter(name => /^(?:licen[cs]e|copying|copyrightnotice|notice)(?:\.|$)/i.test(name)).sort();
  if (!names.length) throw new Error(`缺少完整依赖许可：${pkg.name}`);
  notices.push(`\n===== ${pkg.name}@${pkg.version} (${metadata.license ?? pkg.license ?? 'See text'}) =====\n`);
  for (const name of names) notices.push(`\n${await readFile(join(folder, name), 'utf8')}\n`);
}
const directory = join(root, 'public/licenses'); await mkdir(directory, { recursive: true });
await writeFile(join(directory, 'dependencies.txt'), notices.join(''));
await writeFile(join(directory, 'project-license.txt'), await readFile(join(root, 'LICENSE'), 'utf8'));
await writeFile(join(directory, 'third-party-notices.txt'), await readFile(join(root, 'THIRD_PARTY_NOTICES.txt'), 'utf8'));
console.log('已生成网站随附的应用许可、数据声明和全部运行依赖完整许可。');
