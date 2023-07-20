import type { NormalizedPackageJson } from 'read-pkg-up'
import type { OutputBundle } from 'rollup'
import type { VariantEnvironment } from '../const'
import type { CardBundlerBuildConfig } from './config'

export type BundleMap = Map<VariantEnvironment, OutputBundle>

export interface CardBundlerBuildGeneratorInterface {
  config: CardBundlerBuildConfig
  bundleMap: BundleMap
  pkg: NormalizedPackageJson
}
