import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    {
      name: 'version-theme-bootstrap',
      apply: 'build',
      transformIndexHtml(html) {
        const version = createHash('sha256')
          .update(readFileSync(new URL('./public/theme.js', import.meta.url)))
          .digest('hex').slice(0, 12)
        return html.replace('src="/theme.js"', `src="/theme.js?v=${version}"`)
      },
    },
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    allowedHosts: [
      'localhost.246801357.xyz',
      'localhost',
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
