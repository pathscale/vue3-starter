'use strict'
module.exports = {
  '*.{ts,js,json,yml,yaml,md,html}': 'prettier --write',
  '*.{css,vue}': 'stylelint --fix',
  '*.{ts,js,vue,html}': 'eslint --cache --fix',
}
