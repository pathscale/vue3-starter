import path from 'path'
import dotenv from 'dotenv'

import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import resolve from '@rollup/plugin-node-resolve'
import styles from 'rollup-plugin-styles'
import html from '@rollup/plugin-html'
import vue from 'rollup-plugin-vue'
import alias from '@rollup/plugin-alias'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import compiler from '@ampproject/rollup-plugin-closure-compiler'
import vue3uiPurge from '@pathscale/rollup-plugin-vue3-ui-css-purge'

const extensions = ['.ts', '.mjs', '.js', '.vue']
const env = dotenv.config({ path: path.join(__dirname, '.env') })
const prod = process.env.NODE_ENV === 'production'
const watch = Boolean(process.env.ROLLUP_WATCH) || Boolean(process.env.LIVERELOAD)

const template = ({ title }) => {
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta charset="utf-8">
      <title>${title}</title>
      <link rel="icon" href="favicon.ico">
      <link href="app.css" rel="stylesheet">
    </head>
    <body>
      <div id="app"></div>
      <script src="app.js"></script>
    </body>
  </html>
  `
}
const config = [
  {
    input: 'src/main.js',
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
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'process.env.VUE_APP_VERSION_NUMBER': JSON.stringify(env.parsed.VUE_APP_VERSION_NUMBER),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false,
      }),
      alias({ entries: { vue: '@vue/runtime-dom' } }),

      resolve({
        extensions,
      }),
      commonjs(),
      prod && vue3uiPurge(),
      vue(),

      styles({
        mode: 'extract',
        url: { hash: '[name][extname]', publicPath: env.parsed.BASE_URL, inline: true },
        minimize: prod && { preset: ['default', { discardComments: { removeAll: true } }] },
      }),

      prod &&
        compiler({
          warning_level: 'verbose',
          language_in: 'ECMASCRIPT_NEXT',
          language_out: 'ECMASCRIPT_2018',
          jscomp_off: '*',
        }),

      html({
        publicPath: env.parsed.BASE_URL,
        title: 'Vue demo',
        template
      }),

      watch && serve({ host: '0.0.0.0', contentBase: 'dist', historyApiFallback: true, port: 5000 }),

      watch && livereload({ watch: 'dist' }),
    ],
  },
]

export default config
