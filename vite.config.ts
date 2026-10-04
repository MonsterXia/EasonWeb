import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode, isPreview }) => {
  const env = loadEnv(mode, process.cwd(), 'DEV_')
  const backend = env.DEV_API_BACKEND || 'production'
  if (!['local', 'production'].includes(backend)) {
    throw new Error('DEV_API_BACKEND must be local or production')
  }
  const remote = command === 'serve' && !isPreview && backend === 'production'
  return {
    plugins: [
      vue(),
      vueDevTools(),
      remote && {
        name: 'local-production-api-guard',
        configureServer(server) {
          // Validate the incoming local origin before replacing it upstream.
          server.middlewares.use((req, res, next) => {
            if (!/^\/api(?:\/|$|\?)/.test(req.url || '')) return next()
            const host = req.headers.host || ''
            const loopback = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)
            const origin = req.headers.origin
            if (
              !loopback ||
              (origin && origin !== `http://${host}`) ||
              req.headers['sec-fetch-site'] === 'cross-site'
            ) {
              res.statusCode = 403
              res.end('Local API proxy only accepts same-origin loopback requests')
              return
            }
            next()
          })
        },
      },
      {
        name: 'version-theme-bootstrap',
        apply: 'build',
        transformIndexHtml(html) {
          const version = createHash('sha256')
            .update(readFileSync(new URL('./public/theme.js', import.meta.url)))
            .digest('hex')
            .slice(0, 12)
          return html.replace('src="/theme.js"', `src="/theme.js?v=${version}"`)
        },
      },
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: remote ? '127.0.0.1' : 'localhost',
      port: 5173,
      allowedHosts: ['localhost.246801357.xyz', 'localhost'],
      proxy: {
        '^/api(?:/|$|\\?)': {
          target: remote ? 'https://api.246801357.xyz' : 'http://localhost:8787',
          changeOrigin: true,
          ...(remote
            ? {
                // Browser requests stay on /api; only Vite contacts the production origin.
                headers: {
                  origin: 'https://eason.246801357.xyz',
                  referer: 'https://eason.246801357.xyz/',
                },
                cookieDomainRewrite: '',
                configure(proxy: Parameters<NonNullable<ProxyOptions['configure']>>[0]) {
                  proxy.on('proxyRes', (response) => {
                    // HTTP loopback preview only. Keep HttpOnly, SameSite and expiration.
                    const cookies = response.headers['set-cookie']
                    if (cookies)
                      response.headers['set-cookie'] = cookies.map((cookie) =>
                        cookie.replace(/;\s*Secure(?=;|$)/gi, ''),
                      )
                  })
                },
              }
            : {}),
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
