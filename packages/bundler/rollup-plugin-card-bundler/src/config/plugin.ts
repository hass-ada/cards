import type { Plugin } from 'rollup'
import { type FilterPattern, createFilter } from '@rollup/pluginutils'

interface ConfigPluginOptions {
  /**
   * Only run on these config files.
   */
  include?: FilterPattern
  /**
   * Don't run on these config files.
   */
  exclude?: FilterPattern
}

const WRAPPER_SOURCE = '@hass-ada/rollup-plugin-card-bundler/config/wrapper'
const WRAPPER_SUFFIX = '?hass-ada-rollup-plugin-card-bundler-config-wrapper'

export function configPlugin(options: ConfigPluginOptions = {}) {
  const filter = createFilter(
    options.include || null,
    options.exclude || null,
  )

  return {
    name: 'card-bundler',
    options: (options) => {
      const input = options.input
      if (!input)
        throw new Error('@hass-ada/rollup-plugin-card-bundler/config requires a rollup config as inputs.')
    },
    async resolveId(source, importer, options) {
      if (options.isEntry) {
        if (!filter(source))
          return null

        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...options,
        })
        if (!resolution || resolution.external)
          return resolution

        await this.load({
          id: resolution.id,
        })

        return `${resolution.id}${WRAPPER_SUFFIX}`
      }
    },
    async load(id) {
      if (id.endsWith(WRAPPER_SUFFIX)) {
        const entryId = id.slice(0, -WRAPPER_SUFFIX.length)
        const { hasDefaultExport } = this.getModuleInfo(entryId)!

        if (!hasDefaultExport)
          throw new Error('@hass-ada/rollup-plugin-card-bundler/config requires that your rollup config has a default export.')

        const code = `import { default as rawConfig } from ${JSON.stringify(entryId)};`
          + `import { wrapConfig } from ${JSON.stringify(WRAPPER_SOURCE)};`
          + 'export default wrapConfig(rawConfig);'

        return code
      }
      return null
    },
  } as Plugin
}
