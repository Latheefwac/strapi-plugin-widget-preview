/**
 * Admin entry for strapi-plugin-widget-preview.
 *
 *  - register: adds a "Widget Gallery" left-menu link → the gallery page.
 *  - bootstrap: installs the in-picker preview eye (DOM enhancement).
 */
import { PLUGIN_ID } from './pluginId';
import { PluginIcon } from './components/PluginIcon';
import { installPickerPreview } from './components/installPickerPreview';

export default {
  register(app: any) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: { id: `${PLUGIN_ID}.menu.label`, defaultMessage: 'Widget Gallery' },
      Component: async () => import('./components/GalleryPage'),
      permissions: [],
    });
  },

  bootstrap() {
    installPickerPreview();
  },

  // No bundled translations — intlLabel defaultMessage is used as-is.
  async registerTrads() {
    return [];
  },
};
