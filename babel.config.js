module.exports = {
  presets: ['@babel/preset-env'],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'transform-class-properties',
    // ['module-resolver', {
    //   alias: {
    //     'monaco-vim': '../monaco-vim/src',
    //   },
    // }],
  ]
}
