import type { Plugin } from 'rollup'
import type { PluginOptions as swcPluginOptions } from 'rollup-plugin-swc3'
import { swc } from 'rollup-plugin-swc3'

type PluginOptions = Omit<swcPluginOptions, 'include' | 'exclude' | 'extensions'>

/**
 *
 */
export function plugin(options: PluginOptions): Plugin {
  const parent = swc({
    ...options,
    include: /\.js$/,
  })

  const transform = parent.transform as any

  return {
    name: '@hass-ada/card-bundler/config/swcOutput',
    async renderChunk(code) {
      console.log('===================================')
      console.log('===CODE===')
      const id = 'index.js'
      const result = await Function.prototype.call.call(transform, this, code, id)
      console.log(code)
      console.log('===================================')
      console.log('===RESULT===')
      console.log(result.code)
      console.log('===================================')
      console.log('===END===')
      return result
    },
  }
}

export default plugin
