'use strict'

module.exports = {
  extends: 'stylelint-config-standard',
  rules: {
    indentation: [
      2,
      {
        baseIndentLevel: 0,
      },
    ],
    'no-eol-whitespace': [
      true,
      {
        ignore: ['empty-lines'],
      },
    ],
  },
  customSyntax: 'postcss-html',
}
