import typescript from 'rollup-plugin-typescript2';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

const isProd = process.env.NODE_ENV === 'production';

export default [
  {
    input: 'src/index.ts',
    external: [],
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        clean: isProd,
      }),
    ],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
  },
];
