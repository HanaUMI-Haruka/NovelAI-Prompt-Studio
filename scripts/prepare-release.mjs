import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectReleaseFiles } from './release-utils.mjs';

try {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== '--output')) throw new Error('用法：npm run release:prepare -- [--output 新的目标文件夹]');
  const output = resolve(args[1] || join(root, 'release', `github-source-${new Date().toISOString().replace(/[:.]/g, '-')}`));
  const inside = relative(root, output).replaceAll('\\', '/');
  if (!inside || (!isAbsolute(inside) && !inside.startsWith('../') && inside !== 'release' && !inside.startsWith('release/'))) throw new Error('项目内部只允许输出到release/，避免覆盖源码或递归复制。');
  const files = await collectReleaseFiles(root);
  await mkdir(dirname(output), { recursive: true });
  await mkdir(output); // Deliberately refuses an existing folder; never removes or overwrites it.
  for (const file of files) {
    const target = join(output, file.path); await mkdir(dirname(target), { recursive: true }); await copyFile(join(root, file.path), target);
  }
  await writeFile(join(output, 'RELEASE_MANIFEST.json'), JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2) + '\n');
  await writeFile(join(output, '工作说明.txt'), '开源源码交付说明\n\n本目录按明确清单复制应用源码、词库、许可、构建与测试脚本及GitHub配置。未包含本机工具、用户浏览器数据、旧任务附件或历史工作记录。文件清单及SHA-256见RELEASE_MANIFEST.json。\n发布前请运行npm ci、npm test、npm run build及npm run release:check。此生成脚本本身不代表这些验证已经通过，也不会创建或推送GitHub仓库。\n许可证：应用代码MIT；第三方数据保留各自许可证，详见docs/DATA_SOURCES.md。\n后续操作：按docs/RELEASING.md创建自己的GitHub仓库并上传本目录；可按docs/DEPLOYMENT.md开启Pages。\n');
  console.log(`已准备干净源码：${output}\n${files.length} 个文件；没有上传或发布。`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
