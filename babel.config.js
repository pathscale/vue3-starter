'use strict'

const path = require('path')

const extensions = ['.ts', '.mjs', '.js', '.vue', '.json']
module.exports = api => {
  api.cache.invalidate(() => process.env.NODE_ENV === 'production')
  const plugins = [
    [
      'babel-plugin-module-resolver',
      {
        extensions,
        alias: {
          '~': path.resolve('src').replace(/\\/g, '/'),
          vue: '@vue/runtime-dom',
        },
      },
    ],
  ]
  return { plugins }
}
