/**
 * Widget Gallery — a visual reference of every widget in the project.
 *
 * Fetches the auto-discovered catalog from the plugin's server endpoint, then
 * renders each component as a card with a preview image + name + description.
 * Click a card / the eye button to open a full-size preview.
 *
 * Plain React + inline styles (no design-system imports) so it renders
 * identically across Strapi minor versions. Colors come from a small palette
 * that follows the admin's Light/Dark/Auto setting (see useStrapiTheme).
 */
import * as React from 'react';
import { fetchCatalog, type Catalog, type CatalogItem } from '../api';

/* ------------------------------------------------------------------ theming */

type Mode = 'light' | 'dark';

interface Palette {
  cardBg: string;
  cardBorder: string;
  surface: string; // thumbnail / lightbox image backdrop
  heading: string;
  text: string;
  muted: string;
  faint: string;
  error: string;
  overlay: string; // lightbox scrim
  pageBg: string; // toolbar / page backdrop
  inputBg: string;
  accent: string; // active pill / focus ring
  accentSoft: string; // active pill background
  chipBg: string; // inactive pill / category badge
  shadow: string; // card hover shadow
}

const LIGHT: Palette = {
  cardBg: '#fff',
  cardBorder: '#eee',
  surface: '#F6F6F9',
  heading: '#32324D',
  text: '#32324D',
  muted: '#666687',
  faint: '#8E8EA9',
  error: '#D02B20',
  overlay: 'rgba(0,0,0,0.6)',
  pageBg: '#FAFAFB',
  inputBg: '#fff',
  accent: '#4945FF',
  accentSoft: '#F0F0FF',
  chipBg: '#F0F0F4',
  shadow: 'rgba(33,33,52,0.12)',
};

const DARK: Palette = {
  cardBg: '#212134',
  cardBorder: '#32324D',
  surface: '#181826',
  heading: '#F0F0FF',
  text: '#EAEAEF',
  muted: '#C0C0CF',
  faint: '#A5A5BA',
  error: '#EE5E52',
  overlay: 'rgba(0,0,0,0.75)',
  pageBg: '#181826',
  inputBg: '#181826',
  accent: '#7B79FF',
  accentSoft: '#2B2B45',
  chipBg: '#2B2B45',
  shadow: 'rgba(0,0,0,0.45)',
};

/**
 * Tracks the admin's current theme. Strapi persists the choice in
 * localStorage['STRAPI_THEME'] as 'light' | 'dark' | 'system'; 'system'
 * follows the OS via prefers-color-scheme. In-tab toggles don't fire a
 * 'storage' event, so we poll the key cheaply in addition to listening for
 * OS changes.
 */
const useStrapiTheme = (): Mode => {
  const getMode = React.useCallback((): Mode => {
    let pref = 'system';
    try {
      pref = window.localStorage.getItem('STRAPI_THEME') || 'system';
    } catch {
      /* localStorage may be unavailable */
    }
    if (pref === 'light' || pref === 'dark') return pref;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const [mode, setMode] = React.useState<Mode>(getMode);

  React.useEffect(() => {
    const sync = () => setMode(getMode());

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    mql?.addEventListener?.('change', sync);
    window.addEventListener('storage', sync);
    const poll = window.setInterval(sync, 600);

    return () => {
      mql?.removeEventListener?.('change', sync);
      window.removeEventListener('storage', sync);
      window.clearInterval(poll);
    };
  }, [getMode]);

  return mode;
};

const PaletteContext = React.createContext<Palette>(LIGHT);
const usePalette = () => React.useContext(PaletteContext);

/* ------------------------------------------------------------------- styles */

const page: React.CSSProperties = { padding: '24px 32px 48px' };
const grid: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  alignItems: 'stretch',
};

const imageUrl = (base: string, key: string) => `${base.replace(/\/$/, '')}/${key}.jpg`;

/**
 * Probe every item's preview image and report which ones actually exist.
 *
 * The server can't know this: images live in the host project's `public/`
 * folder (or an external `imageBaseUrl`), so the browser is the only place
 * that can tell a real preview from a 404. Returns `null` while probing, then
 * a Set of the keys whose image loaded — the gallery renders only those, so
 * nested sub-components without a screenshot never show up as empty cards.
 */
const useAvailablePreviews = (catalog: Catalog | null): Set<string> | null => {
  const [available, setAvailable] = React.useState<Set<string> | null>(null);

  React.useEffect(() => {
    if (!catalog) {
      setAvailable(null);
      return;
    }
    const items = catalog.groups.flatMap((g) => g.items);
    if (items.length === 0) {
      setAvailable(new Set());
      return;
    }

    let cancelled = false;
    const found = new Set<string>();
    let remaining = items.length;

    const settle = (key: string, ok: boolean) => {
      if (cancelled) return;
      if (ok) found.add(key);
      if (--remaining === 0) setAvailable(new Set(found));
    };

    items.forEach((it) => {
      const img = new Image();
      img.onload = () => settle(it.key, true);
      img.onerror = () => settle(it.key, false);
      img.src = imageUrl(catalog.imageBaseUrl, it.key);
    });

    return () => {
      cancelled = true;
    };
  }, [catalog]);

  return available;
};

const Placeholder: React.FC<{ name: string }> = ({ name }) => {
  const c = usePalette();
  return (
    <div style={{ textAlign: 'center', color: c.faint, padding: 16 }}>
      <div style={{ fontSize: 30, marginBottom: 6 }}>🖼️</div>
      <div style={{ fontSize: 12 }}>No preview yet</div>
      <div style={{ fontSize: 11, marginTop: 2, color: c.faint }}>{name}</div>
    </div>
  );
};

const Thumb: React.FC<{ item: CatalogItem; base: string; onOpen: () => void }> = ({
  item,
  base,
  onOpen,
}) => {
  const c = usePalette();
  const [failed, setFailed] = React.useState(false);
  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '16 / 9',
        background: c.surface,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
      onClick={onOpen}
      title="Click to preview"
    >
      {failed ? (
        <Placeholder name={item.name} />
      ) : (
        <img
          src={imageUrl(base, item.key)}
          alt={`${item.name} preview`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      )}
      <button
        type="button"
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 32,
          height: 32,
          borderRadius: 999,
          border: 'none',
          background: 'rgba(33,33,52,0.72)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
        }}
        title="Preview full size"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
      >
        👁
      </button>
    </div>
  );
};

const Lightbox: React.FC<{ item: CatalogItem; base: string; onClose: () => void }> = ({
  item,
  base,
  onClose,
}) => {
  const c = usePalette();
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: c.overlay,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.cardBg,
          borderRadius: 10,
          maxWidth: 1000,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${c.cardBorder}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: c.heading }}>{item.name}</div>
            <code style={{ fontSize: 12, color: c.faint }}>{item.uid}</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: c.muted }}
          >
            ×
          </button>
        </div>
        <div style={{ background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <img
            src={imageUrl(base, item.key)}
            alt={`${item.name} full preview`}
            style={{ maxWidth: '100%', maxHeight: '70vh', display: 'block' }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
        {item.description ? (
          <p style={{ padding: '14px 18px', margin: 0, color: c.text, fontSize: 14 }}>{item.description}</p>
        ) : null}
      </div>
    </div>
  );
};

/** A single widget card: preview thumb, name + category badge, 2-line description. */
const Card: React.FC<{ item: CatalogItem; label: string; base: string; onOpen: () => void }> = ({
  item,
  label,
  base,
  onOpen,
}) => {
  const c = usePalette();
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: c.cardBg,
        border: `1px solid ${hover ? c.accent : c.cardBorder}`,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform .15s ease, box-shadow .15s ease, border-color .15s ease',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? `0 8px 24px ${c.shadow}` : 'none',
      }}
    >
      <Thumb item={item} base={base} onOpen={onOpen} />
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 600, color: c.text, fontSize: 14, lineHeight: 1.3 }}>{item.name}</div>
          <span
            style={{
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.4,
              color: c.muted,
              background: c.chipBg,
              padding: '2px 7px',
              borderRadius: 999,
            }}
          >
            {label}
          </span>
        </div>
        {item.description ? (
          <p
            style={{
              margin: 0,
              fontSize: 12.5,
              color: c.muted,
              lineHeight: 1.45,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.description}
          </p>
        ) : null}
      </div>
    </div>
  );
};

/** Search box + page dropdown + category filter pills. */
const Toolbar: React.FC<{
  query: string;
  onQuery: (v: string) => void;
  categories: { category: string; label: string; count: number }[];
  active: string;
  onActive: (v: string) => void;
  total: number;
  pages: { uid: string; name: string; count: number }[];
  activePage: string;
  onPage: (v: string) => void;
}> = ({ query, onQuery, categories, active, onActive, total, pages, activePage, onPage }) => {
  const c = usePalette();
  const [focus, setFocus] = React.useState(false);

  const pill = (key: string, label: string, count: number) => {
    const on = active === key;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onActive(key)}
        style={{
          border: `1px solid ${on ? c.accent : c.cardBorder}`,
          background: on ? c.accentSoft : 'transparent',
          color: on ? c.accent : c.muted,
          borderRadius: 999,
          padding: '5px 12px',
          fontSize: 12.5,
          fontWeight: on ? 600 : 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all .12s ease',
        }}
      >
        {label} <span style={{ opacity: 0.6 }}>({count})</span>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 380 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.faint, fontSize: 14, pointerEvents: 'none' }}>
            🔍
          </span>
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            placeholder="Search widgets by name or description…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '9px 32px 9px 34px',
              borderRadius: 8,
              border: `1px solid ${focus ? c.accent : c.cardBorder}`,
              outline: 'none',
              background: c.inputBg,
              color: c.text,
              fontSize: 13,
              boxShadow: focus ? `0 0 0 3px ${c.accentSoft}` : 'none',
              transition: 'border-color .12s ease, box-shadow .12s ease',
            }}
          />
          {query ? (
            <button
              type="button"
              onClick={() => onQuery('')}
              title="Clear search"
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'transparent',
                color: c.faint,
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          ) : null}
        </div>
        {pages.length > 0 ? (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: c.muted }}>
            <span style={{ whiteSpace: 'nowrap' }}>Page</span>
            <select
              value={activePage}
              onChange={(e) => onPage(e.target.value)}
              style={{
                appearance: 'none',
                padding: '8px 28px 8px 11px',
                borderRadius: 8,
                border: `1px solid ${activePage !== 'all' ? c.accent : c.cardBorder}`,
                background: `${c.inputBg} url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='3'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E") no-repeat right 10px center`,
                color: c.text,
                fontSize: 13,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All pages</option>
              {pages.map((p) => (
                <option key={p.uid} value={p.uid}>
                  {p.name} ({p.count})
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {categories.length > 1 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {pill('all', 'All', total)}
          {categories.map((g) => pill(g.category, g.label, g.count))}
        </div>
      ) : null}
    </div>
  );
};

const GalleryPage: React.FC = () => {
  const mode = useStrapiTheme();
  const c = mode === 'dark' ? DARK : LIGHT;

  const [catalog, setCatalog] = React.useState<Catalog | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<CatalogItem | null>(null);
  const [query, setQuery] = React.useState('');
  const [activeCat, setActiveCat] = React.useState('all');
  const [activePage, setActivePage] = React.useState('all');

  React.useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((e) => setError((e as Error).message));
  }, []);

  // Only surface widgets that have a real preview image; drop the rest (and any
  // group left empty) so nested sub-components don't clutter the gallery.
  const available = useAvailablePreviews(catalog);
  const visibleGroups = React.useMemo(() => {
    if (!catalog || !available) return [];
    return catalog.groups
      .map((g) => ({ ...g, items: g.items.filter((it) => available.has(it.key)) }))
      .filter((g) => g.items.length > 0);
  }, [catalog, available]);

  // Flatten to a single list carrying each item's category label, then filter
  // through page → search → category so the pill/page counts stay accurate.
  const flatItems = React.useMemo(
    () => visibleGroups.flatMap((g) => g.items.map((it) => ({ ...it, label: g.label }))),
    [visibleGroups],
  );

  // Pages that actually contain a visible widget (with their match counts).
  const pageOptions = React.useMemo(() => {
    if (!catalog) return [];
    const uids = new Set(flatItems.map((it) => it.uid));
    return catalog.pages
      .map((p) => ({ uid: p.uid, name: p.name, count: p.components.filter((u) => uids.has(u)).length }))
      .filter((p) => p.count > 0);
  }, [catalog, flatItems]);

  // Reset a page filter that no longer applies (e.g. after catalog reload).
  React.useEffect(() => {
    if (activePage !== 'all' && !pageOptions.some((p) => p.uid === activePage)) setActivePage('all');
  }, [pageOptions, activePage]);

  // Page + search narrow the pool; category pills reflect what's left.
  const searched = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const pageComps =
      activePage === 'all' ? null : new Set(catalog?.pages.find((p) => p.uid === activePage)?.components ?? []);
    return flatItems.filter(
      (it) =>
        (!pageComps || pageComps.has(it.uid)) &&
        (!q ||
          it.name.toLowerCase().includes(q) ||
          it.description.toLowerCase().includes(q) ||
          it.uid.toLowerCase().includes(q)),
    );
  }, [flatItems, catalog, activePage, query]);

  const categories = React.useMemo(() => {
    const order = visibleGroups.map((g) => ({ category: g.category, label: g.label }));
    return order
      .map((g) => ({ ...g, count: searched.filter((it) => it.category === g.category).length }))
      .filter((g) => g.count > 0);
  }, [visibleGroups, searched]);

  // Regroup the final (category-filtered) items back into the original order.
  const filteredGroups = React.useMemo(() => {
    const order = visibleGroups.map((g) => ({ category: g.category, label: g.label }));
    return order
      .filter((g) => activeCat === 'all' || g.category === activeCat)
      .map((g) => ({ ...g, items: searched.filter((it) => it.category === g.category) }))
      .filter((g) => g.items.length > 0);
  }, [visibleGroups, searched, activeCat]);

  // Drop a category filter that the current page/search no longer offers.
  React.useEffect(() => {
    if (activeCat !== 'all' && !categories.some((g) => g.category === activeCat)) setActiveCat('all');
  }, [categories, activeCat]);

  const loading = (!catalog && !error) || (!!catalog && available === null);
  const noPreviews = !loading && !error && visibleGroups.length === 0;
  const noMatches = !loading && !error && visibleGroups.length > 0 && filteredGroups.length === 0;

  return (
    <PaletteContext.Provider value={c}>
      <div style={page}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: c.heading }}>Widget Gallery</h1>
        <p style={{ color: c.muted, marginTop: 6, marginBottom: 20, maxWidth: 720, lineHeight: 1.5 }}>
          A visual reference for every widget you can add to a page. Find the look you want, then pick the
          matching widget by name in the page&apos;s &quot;Add a component&quot; menu. Click any preview to enlarge it.
        </p>

        {error ? <p style={{ color: c.error }}>Failed to load catalog: {error}</p> : null}
        {loading ? <p style={{ color: c.muted }}>Loading…</p> : null}
        {noPreviews ? (
          <p style={{ color: c.muted }}>
            No widget previews yet. Drop a screenshot into{' '}
            <code style={{ color: c.text }}>public/widget-previews/&lt;key&gt;.jpg</code> to add one.
          </p>
        ) : null}

        {!loading && !error && visibleGroups.length > 0 ? (
          <Toolbar
            query={query}
            onQuery={setQuery}
            categories={categories}
            active={activeCat}
            onActive={setActiveCat}
            total={searched.length}
            pages={pageOptions}
            activePage={activePage}
            onPage={setActivePage}
          />
        ) : null}

        {noMatches ? (
          <p style={{ color: c.muted }}>
            No widgets match{query ? <> “{query}”</> : null}. Try a different search, page, or category.
          </p>
        ) : null}

        {filteredGroups.map((group) => (
          <div key={group.category} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, textTransform: 'uppercase', letterSpacing: 0.6, margin: '0 0 12px', color: c.faint }}>
              {group.label} <span style={{ fontWeight: 400 }}>· {group.items.length}</span>
            </h2>
            <div style={grid}>
              {group.items.map((it) => (
                <Card
                  key={it.uid}
                  item={it}
                  label={group.label}
                  base={catalog?.imageBaseUrl ?? ''}
                  onOpen={() => setActive(it)}
                />
              ))}
            </div>
          </div>
        ))}

        {active && catalog ? (
          <Lightbox item={active} base={catalog.imageBaseUrl} onClose={() => setActive(null)} />
        ) : null}
      </div>
    </PaletteContext.Provider>
  );
};

export default GalleryPage;
