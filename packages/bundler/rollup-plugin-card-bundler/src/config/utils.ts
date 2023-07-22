import type { InputPluginOption, OutputPluginOption, Plugin } from 'rollup'
import { NAME as mainPluginName } from '..'
import { asyncFlatMap } from '../utils'

export async function resolvePlugins<P extends InputPluginOption | OutputPluginOption>(plugins?: P): Promise<Plugin[]> {
  plugins = await plugins
  if (plugins === undefined || plugins === false || plugins === null)
    return []

  return Array.isArray(plugins)
    ? asyncFlatMap(plugins, resolvePlugins)
    : [plugins]
}
export async function getMainPlugin(plugins: Plugin[]): Promise<Plugin> {
  const plugin = plugins.find(plugin => plugin.name === mainPluginName)
  if (!plugin)
    throw new Error(`Could not find plugin ${mainPluginName}`)
  return plugin
}

export function renderNamePattern(
  pattern: string,
  replacements: { [name: string]: () => string },
): string {
  return pattern.replace(
    /\[(\w+)]/g,
    (match, type: string) => {
      if (!Object.prototype.hasOwnProperty.call(replacements, type))
        return match

      const replacement = replacements[type]()

      return replacement
    },
  )
}
