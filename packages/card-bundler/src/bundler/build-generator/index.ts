import path from 'node:path'
import type { ExternalOption, InputOption, InputPluginOption, OutputOptions, RollupOptions } from 'rollup'
import { defineConfig } from 'rollup'
import { readPackageUpSync } from 'read-pkg-up'
import type { VariantEnvironment } from '../const'
import { ENVIRONMENT_FORMATS } from '../const'
import * as plugins from '../plugins'
import { bold, cyan, stderr } from '../../cli/helpers'
import { outputFileNames } from './output-filenames'
import type { CardBundlerBuildConfig } from './config'
import type { CardBundlerBuildGeneratorInterface } from './interface'

export class CardBundlerBuildGenerator implements CardBundlerBuildGeneratorInterface {
  public config
  public bundleMap = new Map()
  public pkg

  constructor(config: CardBundlerBuildConfig) {
    this.config = config

    const pkg = readPackageUpSync({ cwd: this.config.base })

    if (!pkg)
      throw new Error('Could not find package.json. Please make sure it exists in the base directory.')

    this.pkg = pkg.packageJson
  }

  makeRollupOptions(): RollupOptions[] {
    const configs = [] as RollupOptions[]

    for (const env of this.config.environments) {
      for (const variant of this.config.variant) {
        const ve = { env, variant } as VariantEnvironment
        configs.push(this.makeSingleRollupOptions(ve))
      }
    }

    configs.push(plugins.assets.makeOptions(this))

    return configs
  }

  makeSingleRollupOptions(ve: VariantEnvironment): RollupOptions {
    return defineConfig({
      input: this.input(ve),
      output: this.output(ve),
      plugins: this.plugins(ve),
      external: this.external(ve),
    })
  }

  input(_ve: VariantEnvironment): InputOption {
    const input = this.config.input

    if (Array.isArray(input)) {
      const names = input.map(p => path.parse(p).name)
      const indexes = names.reduce((a, e, i) => {
        if (e === 'index')
          a.push(i)
        return a
      }, [] as number[])

      if (indexes.length > 1)
        throw new Error('Multiple inputs with the name "index". Please use object syntax to specify input names instead of array.')

      return Object.fromEntries(input.map((p, i) => {
        const name = i === indexes[0] ? this.pkg.name : names[i]
        return [name, p]
      }))
    }

    return input
  }

  output(ve: VariantEnvironment): OutputOptions[] {
    const outputs = (this.config.skipMinify ? [false] : [true, false]).map((shouldMinify) => {
      return this.singleOutput({
        dir: this.config.dist,
        ...outputFileNames(ve, { suffix: { min: shouldMinify, env: true }, prefix: { bundle: true } }),
      }, ve, shouldMinify)
    })

    // If we are bundling for lovelace (hacs compatible) then also emit a bundle in the proper hacs directory (which should be a git worktree).
    if (ve.variant === 'bundle/lovelace' && this.config.hacs) {
      // This bundle should be named very simply and be minified.
      outputs.push(this.singleOutput({
        dir: path.join(this.config.hacs?.dist[ve.env]),
        ...outputFileNames(ve, { suffix: { min: false, env: false }, prefix: { bundle: false } }),
      }, ve, !this.config.skipMinify))
    }

    return outputs
  }

  singleOutput(options: OutputOptions, ve: VariantEnvironment, shouldMinify: boolean): OutputOptions {
    return {
      ...options,
      format: ENVIRONMENT_FORMATS[ve.env],
      sourcemap: true,
      externalLiveBindings: false,
      ...shouldMinify
        ? {
            plugins: [
              plugins.minify(ve),
            ],
          }
        : {},
    }
  }

  plugins(ve: VariantEnvironment): InputPluginOption {
    return [
      plugins.placeholder(),
      plugins.swc(ve),
      plugins.nodeResolve(ve),
      plugins.commonjs(ve),
      plugins.json(ve),
      plugins.assets.sourcePlugin(this.bundleMap, ve),
      plugins.variantWrapper(ve),
      {
        name: 'ada-watch-notify',
        buildStart: (options) => {
          if (this.config.watch) {
            const inputsWithVe = Object.keys(options.input).flatMap(i => `${ve.variant === 'default' ? '' : `${ve.variant}/`}${i}`)
            stderr(cyan(
            `${bold(inputsWithVe.join(', '))} (${ve.env})...`,
            ))
          }
        },
      },
      // visualizer({
      //   template: 'treemap',
      //   gzipSize: true,
      //   emitFile: true,
      //   filename: `stats.${ve.variant.replace('/', '-')}.${ve.env}.html`,
      // }),
    ]
  }

  external(ve: VariantEnvironment): ExternalOption {
    return ve.variant === 'default'
      ? (id) => {
        // Do not bundle dependencies.
          return /node_modules/.test(id)
        }
      : []
  }
}
