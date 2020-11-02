import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import html from '@rollup/plugin-html'
import styles from 'rollup-plugin-styles'
import vue from 'rollup-plugin-vue'
import replace from '@rollup/plugin-replace'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import vue3uiPurge from '@pathscale/rollup-plugin-vue3-ui-css-purge'


const extensions = ['.ts', '.mjs', '.js', '.vue']
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
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false,
      }),

      resolve({
        extensions,
      }),
      commonjs(),
      prod && vue3uiPurge(),
      vue(),

      styles({
        mode: 'inject',
        url: { hash: '[name][extname]', inline: true },
      }),

      html({
        title: 'Vue demo',
        template
      }),

      watch && serve({ host: '0.0.0.0', contentBase: 'dist', historyApiFallback: true, port: 5000 }),

      watch && livereload({ watch: 'dist' }),
    ],
  },
]

export default config
