import { chmod } from 'node:fs/promises'
import path, { resolve } from 'node:path'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { type Plugin, defineConfig } from 'rollup'
import { defineRollupSwcOption, swc } from 'rollup-plugin-swc3'
import MagicString from 'magic-string'
import dts from 'rollup-plugin-dts'

const CLI_CHUNK = 'bin/card-bundler.js'

export function addCliEntry(): Plugin {
  return {
    buildStart() {
      this.emitFile({
        fileName: CLI_CHUNK,
        id: 'src/cli/cli.ts',
        preserveSignature: false,
        type: 'chunk',
      })
    },
    name: 'add-cli-entry',
    renderChunk(code, chunkInfo) {
      if (chunkInfo.fileName === CLI_CHUNK) {
        const magicString = new MagicString(code)
        magicString.prepend('#!/usr/bin/env node\n\n')
        return { code: magicString.toString(), map: magicString.generateMap({ hires: true }) }
      }
      return null
    },
    writeBundle({ dir }) {
      return chmod(resolve(dir!, CLI_CHUNK), '755')
    },
  }
}

function swcOptions() {
  return defineRollupSwcOption({
    env: {
      targets: {
        node: '18',
      },
    },
    sourceMaps: true,
    jsc: {
      parser: {
        syntax: 'typescript',
        decorators: true,
        dynamicImport: true,
      },
      transform: {
        useDefineForClassFields: false,
      },
    },
  })
}

const nodePlugins: readonly Plugin[] = [
  nodeResolve(),
  json(),
  commonjs(),
  swc(swcOptions()),
]

const main = defineConfig({
  external: [
    'rollup',
    '@rollup/plugin-commonjs',
    '@rollup/plugin-json',
    '@rollup/plugin-node-resolve',
    'rollup-plugin-swc3',
    'rollup-plugin-visualizer',
    '@swc/core',
  ],
  input: {
    'card-bundler': 'src/bundler/index.ts',
  },
  output: {
    chunkFileNames: 'shared/[name].js',
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'es',
    generatedCode: 'es2015',
    sourcemap: true,
  },
  plugins: [...nodePlugins, addCliEntry()],
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },
})

const mainTypes = defineConfig({
  ...main,
  output: {
    entryFileNames: '[name].d.ts',
    format: 'es',
    dir: 'dist',
  },
  plugins: [
    dts({
      tsconfig: path.resolve('./tsconfig.json'),
    }),
  ],
})

export default [main, mainTypes]
