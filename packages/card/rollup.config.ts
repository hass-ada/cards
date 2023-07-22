import { defineConfig } from 'rollup'
import { swc } from 'rollup-plugin-swc3'
import dts from 'rollup-plugin-dts'

const mainConfig = defineConfig({
  input: {
    'index': 'src/index.ts',
    'decorators': 'src/decorators.ts',
    'bundler-helpers/frontend-ready': 'src/bundler-helpers/frontend-ready.ts',
  },
  output: {
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'es',
    generatedCode: 'es2015',
    sourcemap: true,
  },
  plugins: [
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
