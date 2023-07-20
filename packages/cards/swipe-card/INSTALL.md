# Install

There are three ways to use `@hass-ada/swipe-card`:

## 1. Bundling with @hass-ada/card-bundler *(recommended if you are using @hass-ada/card-bundler)*

If you are using `@hass-ada/card-bundler` to manage your custom Lovelace cards, you can bundle `@hass-ada/swipe-card` along with your other cards:

Follow the instructions in the [card bundler README](../card-bundler/README.md) on how to bundle cards.

## 2. Adding a Custom Repo to HACS *(recommended if you are using HACS)*

If you prefer using HACS (Home Assistant Community Store) to manage your Lovelace cards, you can add `@hass-ada/swipe-card` as a custom repository. See [HACS documentation on custom repositories](https://hacs.xyz/docs/faq/custom_repositories) for more information.

You should add `https://github.com/@hass-ada/swipe-card` as a custom repository with the category `Lovelace`.

## 3. Manual Installation *(not recommended, you will not receive updates)*

If you prefer to install `@hass-ada/swipe-card` manually, follow these steps:

1. Download the `@hass-ada/swipe-card.js` file from the latest release in this repository.

2. Place the file in your Home Assistant's `www` directory.

3. Reference the file in your Lovelace configuration:

   ```yaml
   resources:
     - url: /local/path/to/@hass-ada/swipe-card.js
       type: module
   ```
