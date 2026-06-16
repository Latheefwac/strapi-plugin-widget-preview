import type { Core } from '@strapi/strapi';

const controller = ({ strapi }: { strapi: Core.Strapi }) => ({
  find(ctx: any) {
    ctx.body = strapi.plugin('widget-preview').service('catalog').getCatalog();
  },
});

export default controller;
