import { type CardClass, type CardOptions, type InputCardClass, registerCard } from './register'

// Typescript decorator.
function legacy<C extends InputCardClass>(tagName: string, clazz: C, options?: CardOptions): CardClass<C> {
  const card = clazz as CardClass<C>
  card.register = () => registerCard(tagName, clazz, options)
  return card
}

// TODO: Support TC39 decorator proposal.

/**
 * Class decorator factory that defines the decorated class as a custom card.
 *
 * ```js
 * @adaCard('my-element', )
 * class MyCard extends HTMLElement {
 *   render() {
 *     return html``;
 *   }
 * }
 * ```
 * @category Decorator
 * @param tagName The tag name of the custom element to define.
 * @param options The card options. If not provided, the card will not be added to the list of custom cards, that home assistant uses to present a nice UI for adding cards.
 */
export function defineCard(tagName: string, options?: CardOptions) {
  return <C extends InputCardClass>(clazz: C) => legacy(tagName, clazz, options)
}
