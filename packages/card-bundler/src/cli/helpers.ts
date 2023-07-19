import process, { env } from 'node:process'
import { createColors } from 'colorette'

export const { bold, cyan, dim, gray, green, red, underline, yellow } = createColors({
  useColor: env.FORCE_COLOR !== '0' && !env.NO_COLOR,
})

export function stderr(...parameters: readonly unknown[]) {
  return process.stderr.write(`${parameters.join('')}\n`)
}
