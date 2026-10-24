// 使用Vite已有的本地esbuild编译生成脚本，不下载工具或执行外部代码。
const { buildSync } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const filename = path.join(__dirname, 'build-sort-index.ts');
const output = buildSync({ entryPoints: [filename], bundle: true, platform: 'node', format: 'cjs', target: 'node22', write: false }).outputFiles[0].text;
const compiled = new Module(filename, module);
compiled.filename = filename; compiled.paths = module.paths;
compiled._compile(output, filename);
