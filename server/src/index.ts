/**
 * Server entry for strapi-plugin-widget-preview.
 *
 * Exposes a single admin endpoint that auto-discovers the host project's
 * components so the admin UI (gallery + picker eye) needs zero per-project
 * configuration.
 */
import config from './config';
import controllers from './controllers';
import routes from './routes';
import services from './services';

export default {
  register() {},
  bootstrap() {},
  destroy() {},
  config,
  controllers,
  routes,
  services,
};
