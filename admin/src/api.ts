import { getFetchClient } from '@strapi/strapi/admin';

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

/** Fetch the auto-discovered widget catalog from the plugin's admin endpoint. */
export async function fetchCatalog(): Promise<Catalog> {
  const { get } = getFetchClient();
  const { data } = await get(`/widget-preview/catalog`);
  return data as Catalog;
}
