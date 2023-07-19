import { nodeResolve as nodeResolvePlugin } from '@rollup/plugin-node-resolve'
import commonjsPlugin from '@rollup/plugin-commonjs'
import jsonPlugin from '@rollup/plugin-json'
import type { Plugin } from 'rollup'
import type { VariantEnvironment } from '../const'

export * from './swc'
export * from './variant-wrapper'
export * as assets from './assets'
export * from './placeholder'

export function nodeResolve(_ve: VariantEnvironment): Plugin {
  return nodeResolvePlugin({
    // Prefer typescript sources over javascript sources.
    extensions: ['.mts', '.ts', '.mjs', '.js'],
    // Use the source field in package.json if it exists - this is useful for
    // packages that have both a source and a dist version, like lit-element.
    // If not found then just prefer esm over cjs.
    mainFields: ['source', 'module', 'main'],
  })
}

export function commonjs(_ve: VariantEnvironment): Plugin {
  return commonjsPlugin({
    include: /node_modules/,
  })
}

export function json(_ve: VariantEnvironment): Plugin {
  return jsonPlugin({
    // All JSON files will be parsed by default,
  })
}
