import type { Plugin } from 'rollup'
import type { Wrapper } from '../option'

const WRAPPER_SUFFIX = 'hass-ada-rollup-plugin-card-bundler-wrapper'
const WRAPPER_FILTER = new RegExp(`^(.+)\\?${WRAPPER_SUFFIX}.+$`)

const WRAPPERS: Record<Wrapper, ((id: string, cards: string[]) => string) | false> = {
  lovelace: (id, cards) => `
    import { ${cards.join(', ')} } from ${JSON.stringify(id)};
    ${cards.map(card => `${card}.register();`).join('\n')}
  `,
  frontend: (id, cards) => `
    import { registerWhenReady } from '@hass-ada/card/bundler-helpers/frontend-ready.js';
    import { ${cards.join(', ')} } from ${JSON.stringify(id)};
    registerWhenReady([${cards.join(', ')}]);
  `,
}

interface PluginOptions {
  wrapper: Wrapper
}

const NAME = '@hass-ada/card-bundler/wrapper'

export function wrapperPlugin(options: PluginOptions) {
  return {
    name: NAME,
    async resolveId(source, importer, resolveOptions) {
      if (resolveOptions.isEntry) {
        const resolution = await this.resolve(source, importer, {
          skipSelf: true,
          ...resolveOptions,
        })
        if (!resolution || resolution.external || resolution.resolvedBy === NAME)
          return null

        await this.load({
          id: resolution.id,
        })

        return `${resolution.id}?${WRAPPER_SUFFIX}${options.wrapper}`
      }
    },
    async load(id) {
      const match = id.match(WRAPPER_FILTER)
      if (match) {
        const entryId = match[1]

        const info = this.getModuleInfo(entryId)
        // Assume all exports are cards
        // TODO: Inspect AST to determine if this is true.
        const cards = info!.exports ?? []
        if (cards.length === 0) {
          this.warn(`No cards found for ${entryId}.`)
          return ''
        }
        const wrapper = WRAPPERS[options.wrapper]
        if (!wrapper)
          return

        return wrapper(entryId, cards)
      }
      return null
    },
  } as Plugin
}

export default wrapperPlugin
