import type { PropertyValues } from 'lit'
import {
  LitElement,
  html,
} from 'lit'
import { state } from 'lit/decorators.js'
import type { HomeAssistant, LovelaceCard, LovelaceCardConfig } from 'custom-card-helpers/dist/types.js'
import type { SwiperOptions } from 'swiper/types'
import { ScopedRegistryHost } from '@lit-labs/scoped-registry-mixin'

import { defineCard } from '@hass-ada/card/decorators'
import { SwiperContainer, SwiperSlide } from './swiper-element'

const LOG_TAG = '[swipe-card]'
const __CARD = Symbol('swipe-card/swiper-slide/card')

interface SwipeCardConfig {
  swiper: SwiperOptions
  cards: LovelaceCardConfig[]
}

const DEFAULT_SWIPER_OPTIONS: SwiperOptions = {
  direction: 'horizontal',
  slidesPerView: 1,
}

type SwipeCardSwiperSlide = {
  [__CARD]: LovelaceCard
} & SwiperSlide

interface _CardHelpers {
  createCardElement: (config: LovelaceCardConfig) => LovelaceCard
}

declare global {
  interface Window {
    loadCardHelpers: () => Promise<_CardHelpers>
  }
  interface ShadowRoot {
    createElement: typeof Document.prototype.createElement
  }
}

@defineCard('swipe-card', {
  name: 'Swipe Card',
  description: 'A card that allows you to swipe through multiple cards.',
})
export class SwipeCard extends ScopedRegistryHost(LitElement) {
  static elementDefinitions = {
    'swiper-container': SwiperContainer,
    'swiper-slide': SwiperSlide,
  }

  _hass: HomeAssistant | undefined
  _swiperContainer: SwiperContainer | undefined

  @state() _config: SwipeCardConfig | undefined
  @state() _slides: Array<SwipeCardSwiperSlide> = []

  set hass(hass: HomeAssistant) {
    this._hass = hass
    this._slides.forEach((slide) => {
      slide[__CARD].hass = this.hass
    })
  }

  get hass() {
    return this._hass!
  }

  setConfig(config: SwipeCardConfig) {
    if (!config)
      throw new Error(`${LOG_TAG} No config.`)
    if (!config.cards)
      throw new Error(`${LOG_TAG} No 'card:' config.`)
    if (!Array.isArray(config.cards))
      throw new Error(`${LOG_TAG} 'card:' must be an array.`)

    this._config = { ...config }
  }

  async willUpdate(changedProperties: PropertyValues<this>) {
    if (
      changedProperties.has('_config')
    ) {
      this._swiperContainer = this.shadowRoot!.createElement('swiper-container') as SwiperContainer
      this._swiperContainer.setAttribute('init', 'false')

      Object.assign(this._swiperContainer, { ...DEFAULT_SWIPER_OPTIONS, ...this._config!.swiper })

      await this._createSlides()

      this._swiperContainer.initialize()
    }

    if (changedProperties.has('_slides') && this._swiperContainer) {
      while (this._swiperContainer.firstChild)
        this._swiperContainer.removeChild(this._swiperContainer.firstChild)

      for (const slide of this._slides)
        this._swiperContainer.appendChild(slide)
    }
  }

  _createCard(cardConfig: LovelaceCardConfig, cardHelpers: _CardHelpers) {
    const card = cardHelpers.createCardElement(cardConfig)
    card.hass = this.hass
    return card
  }

  _createSlide(cardConfig: LovelaceCardConfig, cardHelpers: _CardHelpers): SwipeCardSwiperSlide {
    const card = this._createCard(cardConfig, cardHelpers)

    const swiperSlide = this.shadowRoot!.createElement('swiper-slide') as SwipeCardSwiperSlide
    swiperSlide.appendChild(card)
    swiperSlide[__CARD] = card
    card.addEventListener('ll-rebuild', (ev) => {
      ev.stopPropagation()
      void this._rebuildSlide(swiperSlide, cardConfig)
    })
    return swiperSlide
  }

  async _createSlides() {
    const cardHelpers = await (window).loadCardHelpers()
    this._slides = this._config!.cards.map((cardConfig) => {
      return this._createSlide(cardConfig, cardHelpers)
    })
  }

  async _rebuildSlide(el: SwipeCardSwiperSlide, cardConfig: LovelaceCardConfig) {
    const cardHelpers = await (window).loadCardHelpers()
    const newEl = this._createSlide(cardConfig, cardHelpers)

    this._slides = this._slides.map(slide => (slide === el ? newEl : slide))
  }

  render() {
    return html`${this._swiperContainer}`
  }
}
