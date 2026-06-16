/**
 * In-picker preview eye — injects a 👁 button onto each tile of Strapi's native
 * "Pick one component" dynamic-zone picker, opening a preview of the widget.
 *
 * Strapi exposes no injection zone for that picker, so this enhances the
 * rendered DOM directly: a MutationObserver matches each tile by its visible
 * widget NAME (from the auto-discovered catalog), scoped to the panel that
 * contains the "Pick one component" heading. Defensive by design — if a future
 * Strapi version changes the markup, the eye simply doesn't appear and the
 * picker keeps working. Nothing is patched or forked.
 */
import { fetchCatalog, type CatalogItem } from '../api';

const HEADING_RE = /pick one component/i;
const MARK = 'data-wp-eye';

const EYE_SVG =
  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';

let byName: Map<string, CatalogItem> | null = null;
let imageBaseUrl = '/widget-previews';
let loading = false;

export function installPickerPreview(): void {
  if (typeof window === 'undefined' || (window as any).__wpPickerEye) return;
  (window as any).__wpPickerEye = true;

  /* ---- Lightbox (plain DOM — the picker is outside the React tree) ---- */
  let overlay: HTMLDivElement | null = null;
  const closePreview = () => {
    overlay?.remove();
    overlay = null;
    document.removeEventListener('keydown', onEsc);
  };
  const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && closePreview();

  const imageUrl = (key: string) => `${imageBaseUrl.replace(/\/$/, '')}/${key}.png`;

  const openPreview = (it: CatalogItem) => {
    closePreview();
    overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100000;display:flex;align-items:center;justify-content:center;padding:32px';
    overlay.addEventListener('click', closePreview);

    const box = document.createElement('div');
    box.style.cssText =
      'background:#fff;border-radius:10px;max-width:1000px;width:100%;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.3)';
    box.addEventListener('click', (e) => e.stopPropagation());
    box.innerHTML = `
      <div style="padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700;color:#32324D">${it.name}</div>
          <code style="font-size:12px;color:#8E8EA9">${it.uid}</code>
        </div>
        <button type="button" data-close style="border:none;background:transparent;font-size:24px;line-height:1;cursor:pointer;color:#666687">&times;</button>
      </div>
      <div data-stage style="background:#F6F6F9;display:flex;align-items:center;justify-content:center;min-height:220px"></div>
      ${it.description ? `<p style="padding:14px 18px;margin:0;color:#32324D;font-size:14px;line-height:1.5">${it.description}</p>` : ''}`;
    box.querySelector('[data-close]')?.addEventListener('click', closePreview);

    const stage = box.querySelector('[data-stage]') as HTMLElement;
    const img = new Image();
    img.alt = `${it.name} preview`;
    img.style.cssText = 'max-width:100%;max-height:70vh;display:block';
    img.addEventListener('load', () => {
      stage.innerHTML = '';
      stage.appendChild(img);
    });
    img.addEventListener('error', () => {
      stage.innerHTML = `<div style="padding:48px;color:#8E8EA9;text-align:center">No preview yet<br><small>add ${imageUrl(it.key)}</small></div>`;
    });
    img.src = imageUrl(it.key);

    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onEsc);
  };

  /* ---- Find the picker tile that owns a matched name label ---- */
  const findCard = (label: HTMLElement): HTMLElement | null => {
    let node: HTMLElement | null = label.parentElement;
    for (let i = 0; i < 6 && node; i++) {
      const w = node.offsetWidth;
      if (node.querySelector('svg') && w >= 90 && w <= 420) return node;
      node = node.parentElement;
    }
    return label.parentElement?.parentElement ?? null;
  };

  const addEye = (cardEl: HTMLElement, it: CatalogItem) => {
    if (cardEl.getAttribute(MARK) === '1') return;
    cardEl.setAttribute(MARK, '1');
    if (getComputedStyle(cardEl).position === 'static') cardEl.style.position = 'relative';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = `Preview ${it.name}`;
    btn.setAttribute('aria-label', `Preview ${it.name}`);
    btn.innerHTML = EYE_SVG;
    btn.style.cssText =
      'position:absolute;top:8px;right:8px;z-index:5;width:28px;height:28px;border:none;border-radius:6px;background:transparent;cursor:pointer;color:#32324D;display:flex;align-items:center;justify-content:center;padding:0';
    btn.addEventListener('mouseenter', () => (btn.style.background = 'rgba(73,69,255,.12)'));
    btn.addEventListener('mouseleave', () => (btn.style.background = 'transparent'));

    const swallow = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    btn.addEventListener('pointerdown', swallow, true);
    btn.addEventListener('mousedown', swallow, true);
    btn.addEventListener(
      'click',
      (e) => {
        swallow(e);
        openPreview(it);
      },
      true,
    );

    cardEl.appendChild(btn);
  };

  const enhance = () => {
    if (!byName) return;
    const all = Array.from(document.querySelectorAll<HTMLElement>('span,div,p,h1,h2,h3,h4'));
    const heading = all.find((el) => el.childElementCount === 0 && HEADING_RE.test(el.textContent || ''));
    if (!heading) return;

    let root: HTMLElement | null = heading.parentElement;
    for (let i = 0; i < 10 && root; i++) {
      const hasTile = Array.from(root.querySelectorAll<HTMLElement>('span,div,p')).some(
        (e) => e.childElementCount === 0 && byName!.has((e.textContent || '').trim().toLowerCase()),
      );
      if (hasTile) break;
      root = root.parentElement;
    }
    if (!root) return;

    root.querySelectorAll<HTMLElement>('span,div,p,h3,h4').forEach((el) => {
      if (el.childElementCount !== 0) return;
      const it = byName!.get((el.textContent || '').trim().toLowerCase());
      if (!it) return;
      const cardEl = findCard(el);
      if (cardEl) addEye(cardEl, it);
    });
  };

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      try {
        enhance();
      } catch {
        /* never let a DOM quirk break the admin */
      }
    });
  };

  const ensureCatalog = () => {
    if (byName || loading) return;
    loading = true;
    fetchCatalog()
      .then((cat) => {
        imageBaseUrl = cat.imageBaseUrl || '/widget-previews';
        const m = new Map<string, CatalogItem>();
        for (const g of cat.groups) for (const it of g.items) m.set(it.name.trim().toLowerCase(), it);
        byName = m;
        schedule(); // picker may already be open
      })
      .catch(() => {})
      .finally(() => {
        loading = false;
      });
  };

  // Load the catalog once the first picker appears (avoids an eager call on
  // every admin page). Until then `enhance` is a no-op.
  const observer = new MutationObserver(() => {
    if (!byName) ensureCatalog();
    schedule();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  ensureCatalog();
  schedule();
}
