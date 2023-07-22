import type { Plugin } from 'rollup'
import type { PluginOptions, PluginOptionsContainer } from './option'

export const NAME = '@hass-ada/card-bundler'

/**
 * A rollup plugin for bundling Home Assistant Lovelace cards.
 *
 * NOTE: This plugin requires that you run rollup with
 * `@hass-ada/rollup-plugin-card-bundler/config` as a config plugin.
 * Example: `rollup --configPlugin @hass-ada/rollup-plugin-card-bundler/config -c rollup.config.ts`
 */
export function plugin(options: PluginOptions): Plugin & PluginOptionsContainer {
  return {
    __options: options,
    name: NAME,
    options() {
      // If we actually run this code, it means that the user didn't run rollup
      // with `@hass-ada/rollup-plugin-card-bundler/config` as a config plugin.
      throw new Error('@hass-ada/rollup-plugin-card-bundler requires that you run rollup with @hass-ada/rollup-plugin-card-bundler/config as a config plugin.')
    },
  }
}

export default plugin
