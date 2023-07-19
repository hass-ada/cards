import { swc as rollupSwc, minify as rollupSwcMinify } from 'rollup-plugin-swc3'
import type { VariantEnvironment } from '../const'
import { HOME_ASSISTANT_FRONTEND_BROWSERSLIST } from '../const'

export function swc(ve: VariantEnvironment) {
  return rollupSwc({
    exclude: /^$/,
    include: /\.[mc]?[jt]sx?$/,
    env: {
      targets: HOME_ASSISTANT_FRONTEND_BROWSERSLIST[ve.env],
      // @ts-expect-error https://swc.rs/docs/configuration/compilation#envbugfixes
      bugfixes: true,
    },
    sourceMaps: true,
    jsc: {
      externalHelpers: true,
      // Do not minify in this step. We will do it in an output plugin.
      minify: {
        compress: false,
        mangle: false,
        sourceMap: true,
      },
      parser: {
        syntax: 'typescript',
        decorators: true,
        dynamicImport: true,
      },
      transform: {
        useDefineForClassFields: false,
      },
    },
  })
}

export function minify(_ve: VariantEnvironment) {
  return rollupSwcMinify({
    compress: true,
    mangle: {
      toplevel: true,
    },
    sourceMap: true,
  })
}
