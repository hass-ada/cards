import type { Plugin } from 'rollup'
import type { NormalizedPackageJson } from 'read-pkg-up'
import type { CardBundlerBuildGeneratorInterface } from '../../build-generator/interface'

function exportsField(): Record<string, Record<string, Record<string, string> | string>> {
  const exp = {} as Record<string, Record<string, Record<string, string> | string>>

  // If single entry, make index the single card.
  const entries = {
    '.': 'swipe-card',
    './swipe-card': 'swipe-card',
  }

  /*
  TODO: If multiple entries, also make a index entry that exports all entries.
  const entries = {
    '.': 'index',r
    './swipe-card': 'swipe-card',
    './other-card': 'other-card',
  }
  */

  for (const [alias, entry] of Object.entries(entries)) {
    // In the browser, we have three options, unbundled, bundled, and bundled for frontend use.
    for (const type of ['', '/bundle/lovelace', '/bundle/frontend']) {
      const key = `${alias}${type}`
      const path = `.${type}/${entry}`
      exp[key] = {}

      // When using node, always use main module export for each entry.
      // We do not make any CJS builds, so this is always ESM.
      // Allow bundles to be imported in node for some advanced use cases.
      exp[key] = {
        node: `${path}.module.js`,
      }

      exp[key].browser = {
        // When used in a normal script tag. Use systemjs/legacy.
        script: `${path}.es5.js`,
        // When used in a module script tag. Use esm/modern.
        import: `${path}.module.js`,
        default: `${path}.module.js`,
      }
    }
  }

  return exp
}

export function packageJson(generator: CardBundlerBuildGeneratorInterface): Plugin {
  const pkg = generator.pkg as NormalizedPackageJson
  return {
    name: 'ada-pkg-pkg',
    async generateBundle() {
      // TODO: Support missing fields.
      const newPkg = {
        name: pkg.name,
        type: 'module',
        version: pkg.version,
        description: pkg.description,
        author: pkg.author,
        license: pkg.license,
        keywords: pkg.keywords,
        exports: exportsField(),
        dependencies: pkg.dependencies,
      }

      this.emitFile({
        type: 'asset',
        fileName: 'package.json',
        source: JSON.stringify(newPkg, null, 2),
      })
    },
  }
}
