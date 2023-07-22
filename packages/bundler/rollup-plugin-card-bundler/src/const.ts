/**
 * Browserslist from the Home Assistant frontend project.
 * Try to keep this in sync with that.
 * @see https://github.com/home-assistant/frontend/blob/dev/.browserslistrc
 *
 * Note: Legacy builds may not be supported by downstream projects.
 */
export const HOME_ASSISTANT_FRONTEND_ENV_TARGETS = {
  modern: [
    'supports es6-module-dynamic-import',
    'not Safari < 13',
    'not iOS < 13',
    'not KaiOS > 0',
    'not QQAndroid > 0',
    'not UCAndroid > 0',
    'not dead',
  ],
  legacy: [
    'unreleased versions',
    'last 7 years',
    '> 0.05% and supports websockets',
  ],
} as const

export const BUILTIN_ENV_TARGETS = {
  modern: HOME_ASSISTANT_FRONTEND_ENV_TARGETS.modern,
  latest: HOME_ASSISTANT_FRONTEND_ENV_TARGETS.modern,
  legacy: HOME_ASSISTANT_FRONTEND_ENV_TARGETS.legacy,
  es5: HOME_ASSISTANT_FRONTEND_ENV_TARGETS.legacy,
} as const
