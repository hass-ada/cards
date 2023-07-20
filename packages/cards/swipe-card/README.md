# @hass-ada/swipe-card

`@hass-ada/swipe-card` is a custom Home Assistant Lovelace card that enables users to swipe through multiple Lovelace cards seamlessly. This card provides a user-friendly and interactive way to view different card contents within a single view, allowing for efficient organization and navigation of various information and controls.

![Swipe Card Demo](./.github/assets/swipe-card-demo.gif)

## Install

There are three ways to use `@hass-ada/swipe-card`.

Please see the [installation instructions](./INSTALL.md) for more information.

## Configuration

To use `@hass-ada/swipe-card`, you need to configure it as follows:

```yaml
type: 'custom:swipe-card'
swiper: # Any valid Swiper options
  slidesPerView: 1.4
cards: # Any valid Lovelace cards
  - type: entity
    entity: light.living_room
  - type: thermostat
    entity: climate.living_room
  - type: media-control
    entity: media_player.living_room
```

The `cards` section holds an array of Lovelace cards that you want to display in the swipe view. You can include any valid Lovelace card configuration within the array.

The `swiper` section holds a mapping of [Swiper options](https://swiperjs.com/swiper-api#parameters) that you want to use to configure the swipe view. You can include any valid Swiper option within the mapping.

## Examples

## Contributing

If you encounter any issues, have feature requests, or wish to contribute to `@hass-ada/swipe-card`, feel free to open an issue or submit a pull request on GitHub in [the upstream monorepo for this card](https://github.com/hass-ada/cards).
