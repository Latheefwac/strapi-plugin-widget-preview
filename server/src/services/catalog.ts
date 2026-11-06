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
export interface CatalogPage {
  uid: string;
  name: string;
  components: string[];
}
export interface Catalog {
  imageBaseUrl: string;
  groups: CatalogGroup[];
  pages: CatalogPage[];
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

    // Discover the "pages": every content-type with a dynamic zone, mapped to
    // the component UIDs that zone allows. Lets the gallery filter widgets by
    // the page they can actually be placed on.
    const contentTypes = (strapi.contentTypes ?? {}) as Record<string, any>;
    const pages: CatalogPage[] = [];
    for (const uid of Object.keys(contentTypes)) {
      const ct = contentTypes[uid];
      const attrs = (ct?.attributes ?? {}) as Record<string, any>;
      const comps = new Set<string>();
      for (const name of Object.keys(attrs)) {
        const a = attrs[name];
        if (a?.type === 'dynamiczone' && Array.isArray(a.components)) {
          a.components.forEach((u: string) => comps.add(u));
        }
      }
      if (comps.size === 0) continue;
      pages.push({ uid, name: ct?.info?.displayName ?? uid, components: [...comps] });
    }
    pages.sort((a, b) => a.name.localeCompare(b.name));

    return { imageBaseUrl, groups, pages };
  },
});

export default catalog;
