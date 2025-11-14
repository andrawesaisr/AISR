const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};
const sentryEnv = {
  'process.env.SENTRY_DSN': JSON.stringify(env.SENTRY_DSN || process.env.SENTRY_DSN || ''),
  'process.env.SENTRY_ENVIRONMENT': JSON.stringify(env.SENTRY_ENVIRONMENT || process.env.SENTRY_ENVIRONMENT || ''),
  'process.env.SENTRY_TRACES_SAMPLE_RATE': JSON.stringify(
    env.SENTRY_TRACES_SAMPLE_RATE || process.env.SENTRY_TRACES_SAMPLE_RATE || ''
  ),
  'process.env.SENTRY_PROFILES_SAMPLE_RATE': JSON.stringify(
    env.SENTRY_PROFILES_SAMPLE_RATE || process.env.SENTRY_PROFILES_SAMPLE_RATE || ''
  ),
};

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.DefinePlugin(sentryEnv),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    historyApiFallback: true,
  },
};
