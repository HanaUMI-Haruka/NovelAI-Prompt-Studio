import { fileURLToPath } from 'node:url';
import { collectReleaseFiles } from './release-utils.mjs';

try {
  const files = await collectReleaseFiles(fileURLToPath(new URL('../', import.meta.url)));
  console.log(`发布检查通过：${files.length} 个文件，${(files.reduce((sum, file) => sum + file.bytes, 0) / 1048576).toFixed(2)} MiB。`);
  console.log('已检查明确发布范围、必需文件、符号链接、本机用户目录及常见凭证格式；这不替代人工审阅。');
} catch (error) { console.error(error.message); process.exitCode = 1; }
