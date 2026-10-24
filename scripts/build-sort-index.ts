import { readFileSync, writeFileSync } from 'node:fs';
import { decodeCatalog } from '../src/lib/catalog';
import { buildCatalogSortIndex, encodeCatalogSortIndex, getCatalogFingerprint } from '../src/lib/catalogSortIndex';

async function main() {
  const start = performance.now();
  const tags = decodeCatalog(JSON.parse(readFileSync('public/catalog/danbooru-tags.json', 'utf8')));
  const fingerprint = await getCatalogFingerprint(tags);
  const buffer = encodeCatalogSortIndex(buildCatalogSortIndex(tags), fingerprint);
  writeFileSync('public/catalog/simple-sort-v1.bin', Buffer.from(buffer));
  console.log(`已生成三种排序的正倒序资源：${tags.length.toLocaleString()}条，${(buffer.byteLength / 1048576).toFixed(2)}MiB，${Math.round(performance.now() - start)}ms`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
