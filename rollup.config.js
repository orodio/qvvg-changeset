import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import size from 'rollup-plugin-size'
import pkg from './package.json'

export default [
  // Browser Build
  {
    input: 'src/main.js',
    output: {
      name: 'changeset',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [resolve(), commonjs(), size()],
  },
  // CommonJS build
  {
    input: 'src/main.js',
    external: [],
    output: [
      {
        file: pkg.main,
        format: 'cjs',
      },
      {
        file: pkg.module,
        format: 'es',
      },
    ],
    plugins: [resolve(), commonjs(), size()],
  },
]
