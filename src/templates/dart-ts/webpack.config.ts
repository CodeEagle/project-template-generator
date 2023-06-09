import path from 'path';
import webpack from 'webpack';
import _ from 'lodash';
// @ts-expect-error
import { CheckEsVersionPlugin } from '@bitjourney/check-es-version-webpack-plugin';

const config = {
  mode: 'production',
  entry: './src/index.ts',
  target: ['web', 'es5'],
  output: {
    path: path.resolve(__dirname, 'dist.es5+umd'),
    library: 'ts-project',
    libraryTarget: 'umd',
    globalObject: 'this',
    filename: undefined as string | undefined,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.json', '.wasm'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.dist.webpack.json',
        },
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },

  plugins: [
    new CheckEsVersionPlugin({
      esVersion: 5, // for IE11 support
    }),
    new webpack.DefinePlugin({
      'process.env.TEXT_ENCODING': 'undefined',
      'process.env.TEXT_DECODER': 'undefined',
    }),
  ],

  optimization: {
    minimize: undefined as boolean | undefined,
  },

  // We don't need NodeJS stuff on browsers!
  // https://webpack.js.org/configuration/node/
  node: false,

  devtool: 'source-map',
};

// eslint-disable-next-line import/no-default-export
export default [
  ((config) => {
    config.output.filename = 'ts-project.min.js';
    config.optimization.minimize = true;
    return config;
  })(_.cloneDeep(config)),

  ((config) => {
    config.output.filename = 'ts-project.js';
    config.optimization.minimize = false;
    return config;
  })(_.cloneDeep(config)),
];
