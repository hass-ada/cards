import type { Plugin } from 'rollup'
import type { Variant, VariantEnvironment } from '../const'

export function variantWrapper(ve: VariantEnvironment): Plugin {
  const name = 'ada-variant-wrapper'
  const prefix = `${name}:`

  // If we're not bundling do nothing
  if (ve.variant === 'default')
    return { name }

  const requests = {
    wrapper: 'wrapper',
  }

  const wrappers: Record<Variant, ((module: string, cards: string[]) => string) | false> = {
    'default': false,
    'bundle/lovelace': (module, cards) => `
      import { ${cards.join(', ')} } from ${JSON.stringify(module)};
      ${cards.map(card => `${card}.register();`).join('\n')}
    `,
    'bundle/frontend': (module, cards) => `
      import { registerWhenReady } from '@hass-ada/helpers/frontend/ready';
      import { ${cards.join(', ')} } from ${JSON.stringify(module)};
      registerWhenReady([${cards.join(', ')}]);
    `,
  }

  return {
    name: 'ada-variant-wrapper',
    options(options) {
      options.input = Object.entries(options.input as { [entryAlias: string]: string }).reduce((acc, [name, src]) => {
        acc[name] = `${prefix}${requests.wrapper}:${ve.variant}:${src}`
        return acc
      }, {} as { [entryAlias: string]: string })
      return options
    },
    async resolveId(source, importer, options) {
      if (!source.startsWith(prefix))
        return

      const [_, request, ...rest] = source.split(':')

      if (request === requests.wrapper) {
        const [_, id] = rest
        const resolution = await this.resolve(id, importer, options)
        if (resolution && !resolution.external)
          await this.load(resolution)

        return `\0${source}`
      }
    },
    load(rawId) {
      if (!rawId.startsWith('\0'))
        return
      if (!rawId.slice(1).startsWith(prefix))
        return

      const [_, request, variant, id] = rawId.slice(1).split(':', 4)

      if (request === requests.wrapper) {
        const info = this.getModuleInfo(id)
        // Assume all exports are cards
        // TODO: Inspect AST to determine if this is true.
        const cards = info!.exports ?? []
        if (cards.length === 0) {
          this.warn(`No cards found for ${id}.`)
          return ''
        }
        const wrapper = wrappers[variant as Variant]
        if (!wrapper)
          return
        return wrapper(id, cards)
      }
    },
  }
}
