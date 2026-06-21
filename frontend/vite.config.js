import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return;
                    }
                    if (id.includes('recharts')) {
                        return 'vendor-recharts';
                    }
                    if (id.includes('/node_modules/d3-') || id.includes('/node_modules/internmap/') || id.includes('/node_modules/delaunator/') || id.includes('/node_modules/robust-predicates/')) {
                        return 'vendor-d3';
                    }
                    if (id.includes('@tanstack/react-query')) {
                        return 'vendor-query';
                    }
                },
            },
        },
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8000',
                changeOrigin: true,
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts']
    }
});
