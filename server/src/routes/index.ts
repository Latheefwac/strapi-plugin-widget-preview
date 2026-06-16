/**
 * Admin-only route: the panel fetches the auto-discovered catalog from here.
 * Mounted at `/widget-preview/catalog` behind admin authentication.
 */
export default {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/catalog',
        handler: 'catalog.find',
        config: {
          policies: [],
        },
      },
    ],
  },
};
