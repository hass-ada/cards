import type { OutputOptions, RollupOptions, RollupOptionsFunction, defineConfig } from 'rollup'
import createDeepMerge from '@fastify/deepmerge'
import type { PluginOptions as swcPluginOptions } from 'rollup-plugin-swc3'
import { swc } from 'rollup-plugin-swc3'
import type { EnvConfig } from '@swc/core'
import type { PluginOptionsContainer, Variant, VariantOutputOptions } from '../option'
import { asyncFlatMap, asyncMap } from '../utils'
import variantWrapperPlugin from '../wrapper'
import { BUILTIN_ENV_TARGETS } from '../const'
import { getMainPlugin, renderNamePattern, resolvePlugins } from './utils'
import swcOutput from './swcOutput'

const deepmerge = createDeepMerge({
  all: true,
  mergeArray(options) {
    // overwrite instead of concatenating arrays
    return (target, source) => options.clone(source)
  },
})

const DEFAULT_SWC: swcPluginOptions = {
  sourceMaps: true,
  jsc: {
    target: 'es2022',
    externalHelpers: true,
    parser: {
      syntax: 'typescript',
      decorators: true,
      dynamicImport: true,
    },
    transform: {
      useDefineForClassFields: false,
    },
  },
}

async function makeWrappedConfig(options: RollupOptions): Promise<RollupOptions[]> {
  let plugins = await resolvePlugins(options.plugins)
  const mainPlugin = await getMainPlugin(plugins)
  const pluginOptions = (mainPlugin as unknown as PluginOptionsContainer).__options
  // Remove the main plugin from the list of plugins
  plugins = plugins.filter(plugin => plugin.name !== mainPlugin.name)

  const variants = pluginOptions.variants

  if (!variants)
    throw new Error('No variants defined.')

  const optionsOutput = options.output !== undefined
    ? Array.isArray(options.output) ? options.output : [options.output]
    : [{}] as OutputOptions[]

  async function makeVariantConfig(variant: Variant): Promise<RollupOptions> {
    const variantOutput = variant.output !== undefined
      ? Array.isArray(variant.output) ? variant.output : [variant.output]
      : [{}] as VariantOutputOptions[]

    const output = await asyncFlatMap(optionsOutput, async (oo) => {
      return await asyncMap(variantOutput, async (vo) => {
        const o = deepmerge(oo, vo) as OutputOptions
        delete (o as any).env
        const op = await resolvePlugins(o.plugins)

        let env = vo.env as EnvConfig
        if (typeof vo.env === 'string') {
          if (Object.prototype.hasOwnProperty.call(BUILTIN_ENV_TARGETS, vo.env))
            env = { targets: BUILTIN_ENV_TARGETS[vo.env] }
          else
            throw new Error(`Unknown env ${vo.env}`)
        }
        else {
          env = {
            ...vo.env,
            targets: typeof vo.env.targets === 'string' && Object.prototype.hasOwnProperty.call(BUILTIN_ENV_TARGETS, vo.env.targets)
              ? BUILTIN_ENV_TARGETS[vo.env.targets as keyof typeof BUILTIN_ENV_TARGETS]
              : vo.env.targets,
          }
        }

        const ROLLUP_FORMAT_TO_SWC_MODULE_TYPE = {
          es: 'es6',
          esm: 'es6',
          module: 'es6',
          cjs: 'commonjs',
          commonjs: 'commonjs',
          system: 'systemjs',
          systemjs: 'systemjs',
        } as const

        const type = (ROLLUP_FORMAT_TO_SWC_MODULE_TYPE as any)[o.format || 'esm'] as typeof ROLLUP_FORMAT_TO_SWC_MODULE_TYPE[keyof typeof ROLLUP_FORMAT_TO_SWC_MODULE_TYPE] | undefined
        if (!type)
          throw new Error(`@hass-ada/rollup-plugin-card-bundler does not support output.format ${o.format}`)

        const variantSwc = deepmerge(
          DEFAULT_SWC,
          pluginOptions.swc || {},
          variant.swc || {},
          {
            env,
            module: {
              type,
            },
          } as swcPluginOptions,
          vo.swc || {},
        ) as swcPluginOptions

        // Merge parser seperately because we don't want the typescript params
        if (variantSwc.jsc?.parser?.syntax === 'typescript') {
          variantSwc.jsc = {
            ...variantSwc.jsc,
            parser: {
              syntax: 'ecmascript',
            },
          }
        }

        const replacements = {
          variant: () => variant.name,
          env: () => {
            if (typeof vo.env === 'string')
              return vo.env
            return vo.env.name
          },
        }

        return {
          ...o,
          plugins: [
            swcOutput(variantSwc),
            ...op,
          ],
          entryFileNames(chunkInfo) {
            const entryFileNames = (oo.entryFileNames || '[name].js')
            return renderNamePattern(typeof entryFileNames === 'function' ? entryFileNames(chunkInfo) : entryFileNames, replacements)
          },
          chunkFileNames(chunkInfo) {
            const chunkFileNames = (oo.chunkFileNames || '[name]-[hash].js')
            return renderNamePattern(typeof chunkFileNames === 'function' ? chunkFileNames(chunkInfo) : chunkFileNames, replacements)
          },
          assetFileNames(chunkInfo) {
            const assetFileNames = (oo.assetFileNames || 'assets/[name]-[hash][extname]')
            return renderNamePattern(typeof assetFileNames === 'function' ? assetFileNames(chunkInfo) : assetFileNames, replacements)
          },
        } as OutputOptions
      })
    })

    return {
      ...options,
      external: variant.external,
      plugins: [
        swc(deepmerge(
          DEFAULT_SWC,
          pluginOptions.swc || {},
          variant.swc || {},
        )),
        ...plugins,
        variant.wrapper && variantWrapperPlugin({ wrapper: variant.wrapper }),
      ],
      output,
    }
  }

  return await asyncMap(variants, variant => makeVariantConfig(variant))
}

export function wrapConfig(optionsOrFunction: ReturnType<typeof defineConfig>): RollupOptionsFunction {
  return async (commandLineArgs) => {
    const options = typeof optionsOrFunction === 'function' ? await optionsOrFunction(commandLineArgs) : optionsOrFunction
    return asyncFlatMap((Array.isArray(options) ? options : [options]), makeWrappedConfig)
  }
}
