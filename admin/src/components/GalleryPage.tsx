/**
 * Widget Gallery — a visual reference of every widget in the project.
 *
 * Fetches the auto-discovered catalog from the plugin's server endpoint, then
 * renders each component as a card with a preview image + name + description.
 * Click a card / the eye button to open a full-size preview.
 *
 * Plain React + inline styles (no design-system imports) so it renders
 * identically across Strapi minor versions.
 */
import * as React from 'react';
import { fetchCatalog, type Catalog, type CatalogItem } from '../api';

const page: React.CSSProperties = { padding: 24, maxWidth: 1200 };
const grid: React.CSSProperties = {
  display: 'grid',
  gap: 16,
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
};
const card: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #eee',
  borderRadius: 8,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};
const thumbWrap: React.CSSProperties = {
  position: 'relative',
  aspectRatio: '16 / 9',
  background: '#F6F6F9',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
};
const eyeBtn: React.CSSProperties = {
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
};

const imageUrl = (base: string, key: string) => `${base.replace(/\/$/, '')}/${key}.png`;

const Placeholder: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ textAlign: 'center', color: '#8E8EA9', padding: 16 }}>
    <div style={{ fontSize: 30, marginBottom: 6 }}>🖼️</div>
    <div style={{ fontSize: 12 }}>No preview yet</div>
    <div style={{ fontSize: 11, marginTop: 2, color: '#A5A5BA' }}>{name}</div>
  </div>
);

const Thumb: React.FC<{ item: CatalogItem; base: string; onOpen: () => void }> = ({
  item,
  base,
  onOpen,
}) => {
  const [failed, setFailed] = React.useState(false);
  return (
    <div style={thumbWrap} onClick={onOpen} title="Click to preview">
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
        style={eyeBtn}
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
        background: 'rgba(0,0,0,0.6)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 10, maxWidth: 1000, width: '100%', overflow: 'hidden' }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>{item.name}</div>
            <code style={{ fontSize: 12, color: '#8E8EA9' }}>{item.uid}</code>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: '#666687' }}
          >
            ×
          </button>
        </div>
        <div style={{ background: '#F6F6F9', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
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
          <p style={{ padding: '14px 18px', margin: 0, color: '#32324D', fontSize: 14 }}>{item.description}</p>
        ) : null}
      </div>
    </div>
  );
};

const GalleryPage: React.FC = () => {
  const [catalog, setCatalog] = React.useState<Catalog | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [active, setActive] = React.useState<CatalogItem | null>(null);

  React.useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div style={page}>
      <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Widget Gallery</h1>
      <p style={{ color: '#666687', marginTop: 6, marginBottom: 24 }}>
        A visual reference for every widget you can add to a page. Find the look you want here, then
        pick the matching widget by name in the page&apos;s &quot;Add a component&quot; menu. Click any
        preview to enlarge it.
      </p>

      {error ? <p style={{ color: '#D02B20' }}>Failed to load catalog: {error}</p> : null}
      {!catalog && !error ? <p style={{ color: '#666687' }}>Loading…</p> : null}

      {catalog?.groups.map((group) => (
        <div key={group.category} style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 12px' }}>{group.label}</h2>
          <div style={grid}>
            {group.items.map((it) => (
              <div key={it.uid} style={card}>
                <Thumb item={it} base={catalog.imageBaseUrl} onOpen={() => setActive(it)} />
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 600, color: '#32324D' }}>{it.name}</div>
                  {it.description ? (
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#666687', lineHeight: 1.45 }}>
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
  );
};

export default GalleryPage;
