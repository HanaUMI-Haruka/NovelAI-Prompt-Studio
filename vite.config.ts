import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({ plugins: [react()], server: { watch: { ignored: ['**/.tools/**', '**/release/**'] } }, test: { environment: 'node', exclude: [...configDefaults.exclude, '**/.tools/**', '**/release/**'] } });
