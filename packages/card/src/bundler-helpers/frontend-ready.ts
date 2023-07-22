/**
 * This module provides a helper function to register a custom element when home-assistant is ready to do so.
 */

import type { CardClass } from '..'

const KEY = 'ada:helpers:frontend:ready'

declare global {
  interface Window {
    [KEY]: ReturnType<typeof makeReadyHelper>
  }
}

async function waitForScopedCustomElementsPolyfill() {
  // In case we are in a legacy build, wait for the @webcomponents/custom-elements to be loaded.
  while (!window.customElements)
    await new Promise(resolve => window.setTimeout(resolve, 0))

  // ShadowRoot.prototype.createElement is the same check that @webcomponents/scoped-custom-element-registry uses.
  // @ts-expect-error - This is a polyfill that is not typed.
  while (!ShadowRoot.prototype.createElement)
    await new Promise(resolve => window.setTimeout(resolve, 0))
}

async function waitForHomeAssistantElement() {
  // Will immediately resolve if already defined.
  await window.customElements.whenDefined('home-assistant')
}

function makeReadyHelper() {
  const ready = false
  const readyCallbacks: (() => void)[] = []

  ;(async () => {
    await waitForScopedCustomElementsPolyfill()
    await waitForHomeAssistantElement()
    readyCallbacks.forEach(func => func())
  })().catch(console.error)

  return {
    callWhenReady(func: () => void) {
      if (ready)
        func()
      else
        readyCallbacks.push(func)
    },
  }
}

function getFrontendHelpers() {
  if (!window[KEY])
    window[KEY] = makeReadyHelper()

  return window[KEY]
}

/**
 * Register cards when home-assistant is ready to do so.
 * @param cards The cards to register.
 */
export function registerWhenReady(cards: CardClass[]) {
  const helpers = getFrontendHelpers()

  for (const card of cards)
    helpers.callWhenReady(card.register.bind(card))
}
