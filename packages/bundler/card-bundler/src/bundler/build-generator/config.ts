import type { Environment, Variant } from '../const'

export interface CardBundlerBuildConfig {
  input: Record<string, string> | string[]
  watch: boolean
  base: string
  dist: string
  variant: Variant[]
  environments: Environment[]
  skipMinify: boolean
  hacs?: {
    dist: {
      legacy: string
      modern: string
    }
  }
}
