import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
// import typescript from '@rollup/plugin-typescript'
import html from '@rollup/plugin-html'
import styles from 'rollup-plugin-styles'
import vue from 'rollup-plugin-vue'
import replace from '@rollup/plugin-replace'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

const extensions = ['.ts', '.mjs', '.js', '.vue']

const template = () => {
  return `
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Vue Demo</title>

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
        file: 'public/app.js',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    ],

    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        // 'process.env.VUE_APP_VERSION_NUMBER': JSON.stringify(env.parsed.VUE_APP_VERSION_NUMBER),
        __VUE_OPTIONS_API__: false,
        __VUE_PROD_DEVTOOLS__: false,
      }),

      resolve({
        extensions,
      }),
      commonjs(),

      vue(),

      styles({
        mode: 'inject',
        url: { hash: '[name][extname]', inline: true },
      }),

      html({
        title: 'Vue demo',
        template
      }),

      serve({ host: '0.0.0.0', contentBase: 'public', historyApiFallback: true, port: 5000 }),

      livereload({ watch: 'public' }),
    ],
  },
]

export default config
