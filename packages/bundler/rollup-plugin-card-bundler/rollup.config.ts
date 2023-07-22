import { defineConfig } from 'rollup'
import { swc } from 'rollup-plugin-swc3'
import dts from 'rollup-plugin-dts'
import nodeResolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

const mainConfig = defineConfig({
  input: {
    'index': 'src/index.ts',
    'config/index': 'src/config/index.ts',
    'config/wrapper': 'src/config/wrapper.ts',
    'wrapper': 'src/wrapper/index.ts',
  },
  external: /node_modules/,
  output: {
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'es',
    generatedCode: 'es2015',
    sourcemap: true,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    json(),
    swc(
      {
        sourceMaps: true,
        jsc: {
          target: 'es2015',
          parser: {
            syntax: 'typescript',
            decorators: true,
            dynamicImport: true,
          },
          transform: {
            useDefineForClassFields: false,
          },
        },
      },
    ),
  ],
})

const dtsConfig = defineConfig({
  ...mainConfig,
  output: {
    ...mainConfig.output,
    entryFileNames: '[name].d.ts',
    sourcemap: false,
  },
  plugins: [
    dts(),
  ],
})

export default [
  mainConfig,
  dtsConfig,
]
