"use strict";
const config = {
  default: {
    imageBaseUrl: "/widget-previews",
    includeCategories: null,
    excludeComponents: [],
    onlyDocumented: false
  },
  validator(config2) {
    if (config2.imageBaseUrl && typeof config2.imageBaseUrl !== "string") {
      throw new Error("widget-preview: imageBaseUrl must be a string");
    }
  }
};
const controller = ({ strapi }) => ({
  find(ctx) {
    ctx.body = strapi.plugin("widget-preview").service("catalog").getCatalog();
  }
});
const controllers = {
  catalog: controller
};
const routes = {
  admin: {
    type: "admin",
    routes: [
      {
        method: "GET",
        path: "/catalog",
        handler: "catalog.find",
        config: {
          policies: []
        }
      }
    ]
  }
};
const titleCase = (s) => s.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const catalog = ({ strapi }) => ({
  getCatalog() {
    const cfg = strapi.config.get("plugin::widget-preview", {}) ?? {};
    const imageBaseUrl = cfg.imageBaseUrl ?? "/widget-previews";
    const includeCategories = cfg.includeCategories ?? null;
    const exclude = new Set(cfg.excludeComponents ?? []);
    const onlyDocumented = cfg.onlyDocumented ?? false;
    const components = strapi.components ?? {};
    const groupsMap = {};
    for (const uid of Object.keys(components)) {
      const c = components[uid];
      const category = c?.category ?? "uncategorized";
      const description = c?.info?.description ?? "";
      if (includeCategories && !includeCategories.includes(category)) continue;
      if (exclude.has(uid)) continue;
      if (onlyDocumented && !description.trim()) continue;
      (groupsMap[category] ??= []).push({
        uid,
        key: uid.replace(/\./g, "-"),
        name: c?.info?.displayName ?? uid,
        description: c?.info?.description ?? "",
        category
      });
    }
    const groups = Object.keys(groupsMap).sort().map((category) => ({
      category,
      label: titleCase(category),
      items: groupsMap[category].sort((a, b) => a.name.localeCompare(b.name))
    }));
    return { imageBaseUrl, groups };
  }
});
const services = {
  catalog
};
const index = {
  register() {
  },
  bootstrap() {
  },
  destroy() {
  },
  config,
  controllers,
  routes,
  services
};
module.exports = index;
