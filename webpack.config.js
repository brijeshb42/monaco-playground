const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  target: 'web',
  entry: {
    bundle: './src/index.js',
    // "editor.worker": 'monaco-editor/esm/vs/editor/editor.worker.js',
    // "json.worker": 'monaco-editor/esm/vs/language/json/json.worker',
    // "css.worker": 'monaco-editor/esm/vs/language/css/css.worker',
    // "html.worker": 'monaco-editor/esm/vs/language/html/html.worker',
    // "ts.worker": 'monaco-editor/esm/vs/language/typescript/ts.worker',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    globalObject: 'self',
    chunkFilename: '[name].[chunkhash].js',
  },
  optimization: {
    runtimeChunk: 'single',
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
        uglifyOptions: {
          mangle: true,
          keep_classnames: false,
          keep_fnames: false,
        }
      })
    ]
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          compact: false,
        },
      },
    }, {
      test: /\.css$/,
      use: [
        'style-loader',
        'css-loader',
      ],
    }],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, './index.html'),
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new MonacoWebpackPlugin(),
  ],
};
