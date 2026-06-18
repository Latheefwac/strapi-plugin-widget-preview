import type { Core } from '@strapi/strapi';

const titleCase = (s: string) =>
  s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export interface CatalogItem {
  uid: string;
  key: string;
  name: string;
  description: string;
  category: string;
}
export interface CatalogGroup {
  category: string;
  label: string;
  items: CatalogItem[];
}
export interface Catalog {
  imageBaseUrl: string;
  groups: CatalogGroup[];
}

/**
 * Auto-discover the host project's components and shape them into a catalog
 * the admin can render. Zero-config: name ← `info.displayName`, description ←
 * `info.description`, key ← uid with dots→hyphens (image lives at
 * `<imageBaseUrl>/<key>.jpg`).
 */
const catalog = ({ strapi }: { strapi: Core.Strapi }) => ({
  getCatalog(): Catalog {
    const cfg = (strapi.config.get('plugin::widget-preview', {}) ?? {}) as {
      imageBaseUrl?: string;
      includeCategories?: string[] | null;
      excludeComponents?: string[];
      onlyDocumented?: boolean;
    };
    const imageBaseUrl = cfg.imageBaseUrl ?? '/widget-previews';
    const includeCategories = cfg.includeCategories ?? null;
    const exclude = new Set(cfg.excludeComponents ?? []);
    const onlyDocumented = cfg.onlyDocumented ?? false;

    const components = (strapi.components ?? {}) as Record<string, any>;
    const groupsMap: Record<string, CatalogItem[]> = {};

    for (const uid of Object.keys(components)) {
      const c = components[uid];
      const category: string = c?.category ?? 'uncategorized';
      const description: string = c?.info?.description ?? '';
      if (includeCategories && !includeCategories.includes(category)) continue;
      if (exclude.has(uid)) continue;
      if (onlyDocumented && !description.trim()) continue;
      (groupsMap[category] ??= []).push({
        uid,
        key: uid.replace(/\./g, '-'),
        name: c?.info?.displayName ?? uid,
        description: c?.info?.description ?? '',
        category,
      });
    }

    const groups = Object.keys(groupsMap)
      .sort()
      .map((category) => ({
        category,
        label: titleCase(category),
        items: groupsMap[category].sort((a, b) => a.name.localeCompare(b.name)),
      }));

    return { imageBaseUrl, groups };
  },
});

export default catalog;
