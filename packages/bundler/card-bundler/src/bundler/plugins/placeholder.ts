import type { OutputBundle, Plugin } from 'rollup'

const ID = 'ada-placeholder'

export function placeholder(): Plugin {
  return {
    name: ID,
    resolveId: (id) => {
      if (id === ID)
        return `\0${ID}`
    },
    load: (id) => {
      if (id === `\0${ID}`)
        return 'export default {}'
    },
    generateBundle: (_, bundle: OutputBundle) => {
      for (const [key, info] of Object.entries(bundle)) {
        if (info.type === 'chunk' && info.facadeModuleId === `\0${ID}`)
          delete bundle[key]
      }
    },
  }
}

placeholder.inputId = ID
