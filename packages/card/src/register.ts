export type InputCardClass = Omit<typeof HTMLElement, 'new'>
export type CardClass<C extends InputCardClass = InputCardClass> = C & { register: () => void }

declare global {
  interface Window {
    customCards: any[]
  }
}

export interface CardOptions {
  /** The name of the card. */
  name: string

  /** The description of the card. */
  description: string

  /** Preview */
  preview?: boolean
}

/**
 * Register a card with Home Assistant.
 *
 * @param tagName The tag name of the custom element to define.
 * @param clazz The custom element class.
 * @param options The card options. If not provided, the card will not be added to the list of custom cards, that home assistant uses to present a nice UI for adding cards.
 */
export function registerCard(tagName: string, clazz: InputCardClass, options?: CardOptions) {
  if (customElements.get(tagName)) {
    console.error(`%cCustom element ${tagName} already registered, skipping...`, 'font-weight: bold;')
    console.error(`You may be loading multiple instances of the ${tagName} card.`)
    console.error('Please double check your lovelace resources as well as your yaml frontend: configuration.')
    console.error('It is also possible that two cards are using the same tag name. In this case you should open an issue with the author of this card.')
    return
  }

  customElements.define(tagName, clazz as CustomElementConstructor)

  if (options) {
    const { name, description, preview } = options
    window.customCards = window.customCards || []

    window.customCards.push({
      type: tagName,
      name,
      description,
      preview,
    })
  }
}
