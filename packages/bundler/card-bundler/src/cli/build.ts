import path from 'node:path'
import process from 'node:process'
import type { Arguments } from 'yargs-parser'
import type { RollupError, RollupOptions, RollupWatcher } from 'rollup'
import { rollup, watch } from 'rollup'
import { onExit } from 'signal-exit'
import dateTime from 'date-time'
import ms from 'pretty-ms'
import { VARIANTS } from '../bundler/const'
import type { CardBundlerBuildConfig } from '../bundler/build-generator/config'
import { CardBundlerBuildGenerator } from '../bundler'
import { normalizeObjectOptionValue, objectifyOption } from './options'
import { bold, cyan, dim, green, red, stderr, underline } from './helpers'

export const HELP = `Usage: card-bundler build [options]

Options:
  -h, --help             Show this help message
  -i, --input            The input file(s) to build. [required]
  -w, --watch            Watch the input file(s) for changes. [default: false]
       --base             The base directory to resolve from. [default: .]
       --dist            The output directory for the built card(s). [default: dist]
       --variant         The variant(s) to build. [default: all]
                         Possible values: ${['all', ...VARIANTS].join(', ')}
       --legacy          Only build the legacy variant. [default: false]
       --modern          Only build the modern variant. [default: false]
       --skipMinify      Skip minification. [default: false]

HACS options:
       --hacs                Additionallly build in HACS ready bundles. [default: false]
       --hacs.dist.base      The base output directory for the HACS bundles. [default: hacs]
       --hacs.dist.legacy    Output directory relative to --hacs.dist.base for the legacy variant. [default: legacy/dist]
       --hacs.dist.modern    Output directory relative to --hacs.dist.base for the modern variant. [default: modern/dist]
`

export function resolveArguments(parsed: Arguments): CardBundlerBuildConfig {
  // Resolve arguemnts
  const resolved = {} as CardBundlerBuildConfig

  // Base
  if (!parsed.base)
    parsed.base = '.'
  resolved.base = path.resolve(parsed.base)

  // Input
  if (!parsed.input)
    throw new Error('You must specify an input file.')

  // If it is an object
  if (typeof parsed.input === 'object' && parsed.input !== null) {
    resolved.input = Object.fromEntries(Object.entries(parsed.input).map(([key, value]) => {
      return [key, path.resolve(resolved.base, value as string)]
    }))
  }
  // If it's an array or a string
  else {
    const arr = (Array.isArray(parsed.input) ? parsed.input : [parsed.input]).map(input => path.resolve(resolved.base, input))
    resolved.input = arr
  }

  // Dist
  if (!parsed.dist)
    parsed.dist = 'dist'
  resolved.dist = path.resolve(resolved.base, parsed.dist)

  // Watch
  resolved.watch = !!parsed.watch

  // Variant
  if (parsed.variant) {
    if (Array.isArray(parsed.variant))
      resolved.variant = parsed.variant.map(variant => variant)
    else
      resolved.variant = [parsed.variant]
    for (const variant of resolved.variant) {
      if (!VARIANTS.includes(variant))
        throw new Error(`Invalid variant: ${variant}`)
    }
  }
  else {
    resolved.variant = Array.from(VARIANTS)
  }

  // Environments
  resolved.environments = []
  if (parsed.legacy)
    resolved.environments.push('legacy')
  if (parsed.modern)
    resolved.environments.push('modern')
  if (!parsed.legacy && !parsed.modern) {
    resolved.environments.push('legacy')
    resolved.environments.push('modern')
  }

  // Skip minify
  resolved.skipMinify = !!parsed.skipMinify

  // HACS
  if (parsed.hacs) {
    resolved.hacs = normalizeObjectOptionValue(parsed.hacs, objectifyOption) as CardBundlerBuildConfig['hacs']
    if (!resolved.hacs)
      throw new Error('Invalid HACS options.')
    if (!resolved.hacs.dist)
      resolved.hacs.dist = {} as NonNullable<CardBundlerBuildConfig['hacs']>['dist']
    let base = (resolved.hacs.dist as any).base || 'hacs'
    delete (resolved.hacs.dist as any).base
    base = path.resolve(resolved.base, base)
    if (!resolved.hacs.dist.legacy)
      resolved.hacs.dist.legacy = 'legacy/dist'
    resolved.hacs.dist.legacy = path.resolve(base, resolved.hacs.dist.legacy)
    if (!resolved.hacs.dist.modern)
      resolved.hacs.dist.modern = 'modern/dist'
    resolved.hacs.dist.modern = path.resolve(base, resolved.hacs.dist.modern)
  }

  return resolved
}

export async function run(parsed: Arguments) {
  let resolved = {} as CardBundlerBuildConfig
  try {
    resolved = resolveArguments(parsed)
  }
  catch (error) {
    if (error instanceof Error) {
      console.log(HELP)
      console.log()
      console.log(error)
    }
    else {
      console.log(error)
    }
    process.exit(1)
  }

  const generator = new CardBundlerBuildGenerator(resolved)
  const rollupOptions = generator.makeRollupOptions()

  await runRollup(rollupOptions, resolved)
}

async function startBuild(configs: RollupOptions[]): Promise<void> {
  for (const config of configs) {
    const start = performance.now()
    const build = await rollup(config)
    for (const output of (Array.isArray(config.output) ? config.output : [config.output]))
      await build.write(output!)
    stderr(green(`created in ${bold(ms(performance.now() - start))}`))
  }
}

export async function runRollup(configs: RollupOptions[], resolved: CardBundlerBuildConfig): Promise<void> {
  if (!resolved.watch) {
    await startBuild(configs)
    return
  }

  process.env.ROLLUP_WATCH = 'true'
  const isTTY = process.stderr.isTTY
  let watcher: RollupWatcher
  const resetScreen = getResetScreen(isTTY)

  onExit(close)
  process.on('uncaughtException', closeWithError)
  if (!process.stdin.isTTY) {
    process.stdin.on('end', close)
    process.stdin.resume()
  }

  const silent = false

  await startWatch()

  async function startWatch(): Promise<void> {
    watcher = watch(configs as any)

    watcher.on('event', (event) => {
      switch (event.code) {
        case 'ERROR': {
          handleError(event.error, true)
          break
        }
        case 'START': {
          if (!silent)
            resetScreen(underline('card-bundler'))
          break
        }
        case 'BUNDLE_START': {
          // if (!silent)
          //   console.log(event)
          // let input = event.input
          // if (typeof input !== 'string') {
          //   input = Array.isArray(input)
          //     ? input.join(', ')
          //     : Object.values(input as Record<string, string>).join(', ')
          // }
          // stderr(
          //   cyan(`bundles ${bold(input)} → ${bold(event.output.map(relativeId).join(', '))}...`),
          // )

          break
        }
        case 'BUNDLE_END': {
          if (!silent)
            stderr(green(`created in ${bold(ms(event.duration))}`))
          break
        }
        case 'END': {
          if (!silent && isTTY)
            stderr(`\n[${dateTime()}] waiting for changes...`)
        }
      }

      if ('result' in event && event.result)
        event.result.close().catch(error => handleError(error, true))
    })
  }

  async function close(code: number | null | undefined): Promise<void> {
    process.removeListener('uncaughtException', closeWithError)
    // removing a non-existent listener is a no-op
    process.stdin.removeListener('end', close)

    if (watcher)
      await watcher.close()
    if (code)
      process.exit(code)
  }

  // Never resolve
  return new Promise(() => { })
}

function closeWithError(error: Error): void {
  error.name = `Uncaught ${error.name}`
  handleError(error)
}

export function handleError(error: RollupError, recover = false): void {
  const name = error.name || (error.cause as Error)?.name
  const nameSection = name ? `${name}: ` : ''
  const pluginSection = error.plugin ? `(plugin ${error.plugin}) ` : ''
  const message = `${pluginSection}${nameSection}${error.message}`

  const outputLines = [bold(red(`[!] ${bold(message.toString())}`))]

  if (error.url)
    outputLines.push(cyan(error.url))

  if (error.loc) {
    outputLines.push(
      `${((error.loc.file || error.id)!)} (${error.loc.line}:${error.loc.column})`,
    )
  }
  else if (error.id) {
    outputLines.push((error.id))
  }

  if (error.frame)
    outputLines.push(dim(error.frame))

  if (error.stack)
    outputLines.push(dim(error.stack?.replace(`${nameSection}${error.message}\n`, '')))

  outputLines.push('', '')
  stderr(outputLines.join('\n'))

  if (!recover)
    process.exit(1)
}

const CLEAR_SCREEN = '\u001Bc'

export function getResetScreen(
  allowClearScreen: boolean | undefined,
): (heading: string) => void {
  const clearScreen = allowClearScreen
  if (clearScreen)
    return (heading: string) => stderr(CLEAR_SCREEN + heading)

  let firstRun = true
  return (heading: string) => {
    if (firstRun) {
      stderr(heading)
      firstRun = false
    }
  }
}
