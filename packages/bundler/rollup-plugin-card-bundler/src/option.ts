import type { ExternalOption, OutputOptions } from 'rollup'
import { type EnvConfig } from '@swc/core'
import type { PluginOptions as swcPluginOptions } from 'rollup-plugin-swc3'
import type { BUILTIN_ENV_TARGETS } from './const'

export const WRAPPRES = ['lovelace', 'frontend'] as const
export type Wrapper = typeof WRAPPRES[number]

export type VariantEnvConfig = keyof typeof BUILTIN_ENV_TARGETS | (EnvConfig & { targets: keyof typeof BUILTIN_ENV_TARGETS } & { name: string })

export interface VariantOutputOptions extends OutputOptions {
  env: VariantEnvConfig
  swc?: swcPluginOptions
}

export interface Variant {
  /**
   * The name to use for the variant.
   */
  name: string
  wrapper?: Wrapper
  external?: ExternalOption
  output?: VariantOutputOptions | VariantOutputOptions[]
  swc?: swcPluginOptions

}

export interface PluginOptions {
  variants: Variant[]
  swc?: swcPluginOptions
}

export interface PluginOptionsContainer {
  __options: PluginOptions
}
