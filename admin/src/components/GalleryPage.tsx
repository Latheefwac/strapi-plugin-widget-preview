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

const page: React.CSSProperties = { padding: 24, maxWidth: 1200 };
const grid: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
};

const imageUrl = (base: string, key: string) => `${base.replace(/\/$/, '')}/${key}.jpg`;

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

const GalleryPage: React.FC = () => {
  const mode = useStrapiTheme();
  const c = mode === 'dark' ? DARK : LIGHT;

  const [catalog, setCatalog] = React.useState<Catalog | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<CatalogItem | null>(null);

  React.useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <PaletteContext.Provider value={c}>
      <div style={page}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: c.heading }}>Widget Gallery</h1>
        <p style={{ color: c.muted, marginTop: 6, marginBottom: 24 }}>
          A visual reference for every widget you can add to a page. Find the look you want here, then
          pick the matching widget by name in the page&apos;s &quot;Add a component&quot; menu. Click any
          preview to enlarge it.
        </p>

        {error ? <p style={{ color: c.error }}>Failed to load catalog: {error}</p> : null}
        {!catalog && !error ? <p style={{ color: c.muted }}>Loading…</p> : null}

        {catalog?.groups.map((group) => (
          <div key={group.category} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, margin: '0 0 12px', color: c.heading }}>{group.label}</h2>
            <div style={grid}>
              {group.items.map((it) => (
                <div
                  key={it.uid}
                  style={{
                    background: c.cardBg,
                    border: `1px solid ${c.cardBorder}`,
                    borderRadius: 8,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Thumb item={it} base={catalog.imageBaseUrl} onOpen={() => setActive(it)} />
                  <div style={{ padding: 14 }}>
                    <div style={{ fontWeight: 600, color: c.text }}>{it.name}</div>
                    {it.description ? (
                      <p style={{ margin: '6px 0 0', fontSize: 13, color: c.muted, lineHeight: 1.45 }}>
                        {it.description}
                      </p>
                    ) : null}
                  </div>
                </div>
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
