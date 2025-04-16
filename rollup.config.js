import { terser } from 'rollup-plugin-terser'
import alias from '@rollup/plugin-alias'
import commonjs from '@rollup/plugin-commonjs'
import dotenv from 'dotenv'
import fs from 'fs'
import gzip from 'rollup-plugin-gzip'
import html, { makeHtmlAttributes } from '@rollup/plugin-html'
import image from '@rollup/plugin-image'
import json from '@rollup/plugin-json'
import livereload from 'rollup-plugin-livereload'
import path from 'path'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import serve from 'rollup-plugin-serve'
import styles from 'rollup-plugin-styles'
import sucrase from '@rollup/plugin-sucrase'
import vue from '@pathscale/rollup-plugin-vue3'
import vue3svg from '@pathscale/vue3-svg-icons'
import vue3uiPurge from '@pathscale/rollup-plugin-vue3-ui-css-purge'
import zlib from 'zlib'

const extensions = ['.ts', '.mjs', '.js', '.vue', '.json']

const aliases = {
  '~': path.resolve('src').replace(/\\/g, '/'),
}

// eslint-disable-next-line no-undef -- ignore
const env = dotenv.config({ path: path.join(__dirname, '.env') })
const prod = process.env.NODE_ENV === 'production'
const watch = Boolean(process.env.ROLLUP_WATCH) || Boolean(process.env.LIVERELOAD)

const addVersion = fileName => {
  const ver = prod ? env.parsed.VUE_APP_VERSION_NUMBER : Date.now()
  const { dir, ext, base } = path.parse(fileName)
  if (ext === '.html') {
    return fileName
  }
  const filename = base + `?v=${ver}`
  return dir ? `${dir}/${filename}` : filename
}

const template = ({ attributes, files, meta, publicPath, title }) => {
  const scripts = (files.js || [])
    .map(({ fileName }) => {
      const file = addVersion(fileName)
      const attrs = makeHtmlAttributes(attributes.script)
      return `<script src="${publicPath}${file}"${attrs}></script>`
    })
    .join('\n')

  const links = (files.css || [])
    .map(({ fileName }) => {
      const file = addVersion(fileName)
      const attrs = makeHtmlAttributes(attributes.link)
      return `<link href="${publicPath}${file}" rel="stylesheet"${attrs}>`
    })
    .join('\n')

  const metas = meta
    .map(input => {
      const attrs = makeHtmlAttributes(input)
      return `<meta${attrs}>`
    })
    .join('\n')

  return `
  <!doctype html>
  <html${makeHtmlAttributes(attributes.html)}>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      ${metas}
      <title>${title}</title>
      <link rel="icon" href="favicon.ico">
      ${links}
    </head>
    <body>
      <div id="app"></div>
      ${scripts}
    </body>
  </html>
  `
}
const config = [
  {
    input: 'src/main.ts',
    output: [
      {
        format: 'iife',
        file: 'dist/app.js',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    ],

    plugins: [
      json(),
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.VUE_APP_VERSION_NUMBER': JSON.stringify(env.parsed.VUE_APP_VERSION_NUMBER),
        'process.env.VUE_APP_USERNAME': JSON.stringify(env.parsed.VUE_APP_USERNAME),
        'process.env.VUE_APP_PASSWORD': JSON.stringify(env.parsed.VUE_APP_PASSWORD),
        'process.env.AUTH_SERVER': JSON.stringify(env.parsed.AUTH_SERVER),
        'process.env.APP_SERVER': JSON.stringify(env.parsed.APP_SERVER),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false,
        DEBUG: true,
        preventAssignment: true,
      }),

      alias({ entries: aliases }),

      resolve({
        dedupe: [
          'vue',
          '@vue/compiler-core',
          '@vue/compiler-dom',
          '@vue/compiler-sfc',
          '@vue/compiler-ssr',
          '@vue/reactivity',
          '@vue/runtime-core',
          '@vue/runtime-dom',
          '@vue/shared',
          'vuex',
        ],
        preferBuiltins: true,
        extensions,
      }),
      commonjs(),
      vue3svg(),
      prod && vue3uiPurge({ alias: aliases, debug: false }),
      vue({ preprocessStyles: false }),

      image({ exclude: /\.svg$/ }),
      {
        name: 'svg',
        load(id) {
          const [url] = id.split('?')
          if (!/\.svg$/.test(url)) {
            return null
          }
          this.addWatchFile(url)
          return fs.readFileSync(url, 'utf8')
        },
        transform(code, id) {
          const [url, query] = id.split('?')
          if (!/\.svg$/.test(url)) {
            return null
          }
          if (query !== 'data') {
            code = 'data:image/svg+xml;utf8,' + encodeURIComponent(code)
          }
          return { code: `export default ${JSON.stringify(code)};`, map: { mappings: '' } }
        },
      },

      styles({
        mode: 'extract',
        url: {
          hash: '[name][extname]',
          publicPath: env.parsed.BASE_URL,
          inline: true,
        },
        minimize: prod && {
          preset: ['default', { discardComments: { removeAll: true } }],
        },
      }),

      sucrase({ exclude: ['**/node_modules/**'], transforms: ['typescript'] }),

      prod && terser({ format: { comments: false } }),
      prod &&
      gzip({
        fileName: '.br',
        customCompression: content =>
          zlib.brotliCompressSync(Buffer.from(content), {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
          }),
      }),

      html({
        publicPath: env.parsed.BASE_URL,
        title: 'SalesAction',
        template,
      }),

      watch &&
      serve({
        host: '0.0.0.0',
        contentBase: 'dist',
        historyApiFallback: true,
        port: env.parsed.PORT || 5000,
      }),

      watch && livereload({ watch: 'dist' }),
    ],
  },
]

export default config
