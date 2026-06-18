/**
 * Plugin config (host overrides via `config/plugins.ts` →
 * `'widget-preview': { config: { ... } }`).
 *
 * - imageBaseUrl: where preview images are served from. Default `/widget-previews`
 *   (drop `<key>.jpg` into the host project's `public/widget-previews/`).
 * - includeCategories: if set, only these component categories appear. `null` = all.
 * - excludeComponents: component UIDs to hide (e.g. nested sub-components).
 * - onlyDocumented: if true, only components with a non-empty `info.description`
 *   appear — a quick way to hide nested sub-components in projects that
 *   describe their top-level widgets. Default false (show all).
 */
export default {
  default: {
    imageBaseUrl: '/widget-previews',
    includeCategories: null as string[] | null,
    excludeComponents: [] as string[],
    onlyDocumented: false,
  },
  validator(config: Record<string, unknown>) {
    if (config.imageBaseUrl && typeof config.imageBaseUrl !== 'string') {
      throw new Error('widget-preview: imageBaseUrl must be a string');
    }
  },
};
