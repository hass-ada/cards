import type { OutputOptions } from 'rollup'
import type { VariantEnvironment } from '../const'

interface OutputFileNameFuncOptions {
  suffix: { min: boolean; env: boolean }
  prefix: { bundle: boolean }
}

function fileNamesFunc(ve: VariantEnvironment, type: 'entry' | 'chunk' | 'asset', options: OutputFileNameFuncOptions) {
  return (info: { name?: string }) => {
    const name = info.name ?? { entry: 'index', chunk: 'chunk', asset: 'asset' }[type]

    let prefix = ''
    if (options.prefix.bundle && ve.variant.startsWith('bundle/'))
      prefix = `${ve.variant}/`

    prefix += type === 'chunk' ? 'chunks/' : ''

    let suffix = ''
    if (type === 'asset') {
      suffix = '[extname]'
    }
    else {
      if (options.suffix.env)
        suffix += `.${ve.env}`
      if (options.suffix.min)
        suffix += '.min'
      suffix += '.js'
    }

    return `${prefix}${name}${suffix}`
  }
}

export function outputFileNames(ve: VariantEnvironment, options: OutputFileNameFuncOptions): OutputOptions {
  return {
    entryFileNames: fileNamesFunc(ve, 'entry', options),
    chunkFileNames: fileNamesFunc(ve, 'chunk', options),
    assetFileNames: fileNamesFunc(ve, 'asset', options),
  }
}
