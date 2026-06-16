# strapi-plugin-widget-preview

Visual previews for dynamic-zone widgets in **Strapi 5**:

- A **Widget Gallery** page (left menu) showing every component with a preview image, name and description.
- An **eye-icon preview** injected into the native **"Pick one component"** picker — click it to see what a widget looks like before adding it.

**Zero config** — the plugin auto-discovers the components registered in your project. Drop a screenshot per widget into `public/widget-previews/` and you're done.

## Install

```bash
npm install strapi-plugin-widget-preview
# or: yarn add strapi-plugin-widget-preview
```

Enable it (usually auto-enabled; otherwise add to `config/plugins.ts`):

```ts
export default () => ({
  'widget-preview': { enabled: true },
});
```

Rebuild the admin: `yarn build && yarn develop`.

## Add preview images

Each widget's image lives at `public/widget-previews/<key>.png`, where `<key>` is the
component UID with dots replaced by hyphens:

| Component UID          | File                          |
| ---------------------- | ----------------------------- |
| `home.hero`            | `public/widget-previews/home-hero.png` |
| `common.video`         | `public/widget-previews/common-video.png` |

Files in `public/` are served immediately (no restart) at `/widget-previews/<key>.png`.
Widgets without an image show a "No preview yet" placeholder.

## Configuration (optional)

```ts
export default () => ({
  'widget-preview': {
    enabled: true,
    config: {
      // Where preview images are served from. Default: '/widget-previews'
      imageBaseUrl: '/widget-previews',
      // Only show these component categories (default: all)
      includeCategories: null, // e.g. ['home', 'common']
      // Hide specific component UIDs (e.g. nested sub-components)
      excludeComponents: [],   // e.g. ['home.hero-stat-item']
    },
  },
});
```

## How it works

- **Server**: a single admin endpoint `GET /widget-preview/catalog` reads `strapi.components`
  and returns `{ imageBaseUrl, groups[] }`.
- **Admin**: the gallery page and the picker-eye injector both consume that catalog. The
  injector is a defensive DOM enhancement (it matches picker tiles by their displayed name,
  scoped to the picker panel). If a future Strapi version changes the picker markup, the eye
  simply doesn't appear — nothing breaks.

## Development

```bash
yarn install
yarn build      # @strapi/sdk-plugin build → dist/
yarn watch      # rebuild on change
```

## License

MIT
