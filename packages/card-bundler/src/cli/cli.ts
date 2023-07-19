import process from 'node:process'
import parser from 'yargs-parser'

import { version } from '../../package.json'
import * as build from './build.js'

const HELP = `card-bundler version __VERSION__

Usage: card-bundler <command> [options]
        card-bundler [ -h | --help | --version ]


Commands:
  build                       Build the card(s).

Basic options:
  -h, --help                  Show this help message
  --version                   Show the version number
`

const parsed = parser(process.argv.slice(2), {
  alias: {
    help: ['h'],
    input: ['i'],
    watch: ['w'],
  },
  string: ['input', 'base', 'dist', 'variant', 'hacs.dist.base', 'hacs.dist.legacy', 'hacs.dist.modern'],
  boolean: ['help', 'version', 'watch', 'legacy', 'modern', 'skipMinify', 'hacs'],
  configuration: {
    'strip-aliased': true,
    'strip-dashed': true,
  },
})

if (!parsed.help && !parsed.version) {
  if (parsed._.length === 0)
    throw new Error('You must specify a command.')
  if (parsed._.length > 1)
    throw new Error('You must specify only one command.')
}

const command = parsed._.length === 1 ? `${parsed._[0]}`.toLowerCase() : undefined

if (parsed.help) {
  if (!command) {
    console.log(HELP.replace('__VERSION__', version))
  }
  else {
    if (command === 'build')
      console.log(build.HELP.replace('__VERSION__', version))
  }
  process.exit(0)
}
else if (parsed.version) {
  console.log(version)
  process.exit(0)
}
else {
  if (command === 'build')
    build.run(parsed)
}

export {
  version,
}
