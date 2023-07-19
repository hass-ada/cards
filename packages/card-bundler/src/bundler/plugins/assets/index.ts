import type { OutputBundle, Plugin, RollupOptions } from 'rollup'
import type { VariantEnvironment } from '../../const'

import { placeholder } from '../placeholder'
import type { BundleMap, CardBundlerBuildGeneratorInterface } from '../../build-generator/interface'
import { bold, cyan, stderr } from '../../../cli/helpers'
import { packageJson } from './packageJson'

export function sourcePlugin(bundleMap: BundleMap, ve: VariantEnvironment): Plugin {
  return {
    name: 'ada-pkg-source',
    generateBundle: (_, bundle: OutputBundle) => {
      bundleMap.set(ve, bundle)
    },
  }
}

export function makeOptions(generator: CardBundlerBuildGeneratorInterface): RollupOptions {
  return {
    input: placeholder.inputId,
    output: {
      dir: generator.config.dist,
    },
    plugins: [
      placeholder(),
      packageJson(generator),
      {
        name: 'ada-watch-notify',
        buildStart: () => {
          if (generator.config.watch)
            stderr(cyan(`${bold('package.json')}, ${bold('readme')}...`))
        },
      },
    ],
  }
}
