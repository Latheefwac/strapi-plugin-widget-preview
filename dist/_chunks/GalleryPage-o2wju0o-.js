"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const React = require("react");
const index = require("./index-ORu_4YR8.js");
function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const React__namespace = /* @__PURE__ */ _interopNamespace(React);
const page = { padding: 24, maxWidth: 1200 };
const grid = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))"
};
const card = {
  background: "#fff",
  border: "1px solid #eee",
  borderRadius: 8,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column"
};
const thumbWrap = {
  position: "relative",
  aspectRatio: "16 / 9",
  background: "#F6F6F9",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "hidden"
};
const eyeBtn = {
  position: "absolute",
  top: 8,
  right: 8,
  width: 32,
  height: 32,
  borderRadius: 999,
  border: "none",
  background: "rgba(33,33,52,0.72)",
  color: "#fff",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 15
};
const imageUrl = (base, key) => `${base.replace(/\/$/, "")}/${key}.png`;
const Placeholder = ({ name }) => /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { textAlign: "center", color: "#8E8EA9", padding: 16 }, children: [
  /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 30, marginBottom: 6 }, children: "🖼️" }),
  /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 12 }, children: "No preview yet" }),
  /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontSize: 11, marginTop: 2, color: "#A5A5BA" }, children: name })
] });
const Thumb = ({
  item,
  base,
  onOpen
}) => {
  const [failed, setFailed] = React__namespace.useState(false);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: thumbWrap, onClick: onOpen, title: "Click to preview", children: [
    failed ? /* @__PURE__ */ jsxRuntime.jsx(Placeholder, { name: item.name }) : /* @__PURE__ */ jsxRuntime.jsx(
      "img",
      {
        src: imageUrl(base, item.key),
        alt: `${item.name} preview`,
        style: { width: "100%", height: "100%", objectFit: "cover" },
        onError: () => setFailed(true)
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      "button",
      {
        type: "button",
        style: eyeBtn,
        title: "Preview full size",
        onClick: (e) => {
          e.stopPropagation();
          onOpen();
        },
        children: "👁"
      }
    )
  ] });
};
const Lightbox = ({
  item,
  base,
  onClose
}) => {
  React__namespace.useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 1e4,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32
      },
      children: /* @__PURE__ */ jsxRuntime.jsxs(
        "div",
        {
          onClick: (e) => e.stopPropagation(),
          style: { background: "#fff", borderRadius: 10, maxWidth: 1e3, width: "100%", overflow: "hidden" },
          children: [
            /* @__PURE__ */ jsxRuntime.jsxs(
              "div",
              {
                style: {
                  padding: "14px 18px",
                  borderBottom: "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                },
                children: [
                  /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
                    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontWeight: 700 }, children: item.name }),
                    /* @__PURE__ */ jsxRuntime.jsx("code", { style: { fontSize: 12, color: "#8E8EA9" }, children: item.uid })
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: onClose,
                      style: { border: "none", background: "transparent", fontSize: 22, cursor: "pointer", color: "#666687" },
                      children: "×"
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx("div", { style: { background: "#F6F6F9", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 200 }, children: /* @__PURE__ */ jsxRuntime.jsx(
              "img",
              {
                src: imageUrl(base, item.key),
                alt: `${item.name} full preview`,
                style: { maxWidth: "100%", maxHeight: "70vh", display: "block" },
                onError: (e) => {
                  e.currentTarget.style.display = "none";
                }
              }
            ) }),
            item.description ? /* @__PURE__ */ jsxRuntime.jsx("p", { style: { padding: "14px 18px", margin: 0, color: "#32324D", fontSize: 14 }, children: item.description }) : null
          ]
        }
      )
    }
  );
};
const GalleryPage = () => {
  const [catalog, setCatalog] = React__namespace.useState(null);
  const [error, setError] = React__namespace.useState(null);
  const [active, setActive] = React__namespace.useState(null);
  React__namespace.useEffect(() => {
    index.fetchCatalog().then(setCatalog).catch((e) => setError(e.message));
  }, []);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: page, children: [
    /* @__PURE__ */ jsxRuntime.jsx("h1", { style: { fontSize: 28, fontWeight: 700, margin: 0 }, children: "Widget Gallery" }),
    /* @__PURE__ */ jsxRuntime.jsx("p", { style: { color: "#666687", marginTop: 6, marginBottom: 24 }, children: `A visual reference for every widget you can add to a page. Find the look you want here, then pick the matching widget by name in the page's "Add a component" menu. Click any preview to enlarge it.` }),
    error ? /* @__PURE__ */ jsxRuntime.jsxs("p", { style: { color: "#D02B20" }, children: [
      "Failed to load catalog: ",
      error
    ] }) : null,
    !catalog && !error ? /* @__PURE__ */ jsxRuntime.jsx("p", { style: { color: "#666687" }, children: "Loading…" }) : null,
    catalog?.groups.map((group) => /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { marginBottom: 32 }, children: [
      /* @__PURE__ */ jsxRuntime.jsx("h2", { style: { fontSize: 18, margin: "0 0 12px" }, children: group.label }),
      /* @__PURE__ */ jsxRuntime.jsx("div", { style: grid, children: group.items.map((it) => /* @__PURE__ */ jsxRuntime.jsxs("div", { style: card, children: [
        /* @__PURE__ */ jsxRuntime.jsx(Thumb, { item: it, base: catalog.imageBaseUrl, onOpen: () => setActive(it) }),
        /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { padding: 14 }, children: [
          /* @__PURE__ */ jsxRuntime.jsx("div", { style: { fontWeight: 600, color: "#32324D" }, children: it.name }),
          it.description ? /* @__PURE__ */ jsxRuntime.jsx("p", { style: { margin: "6px 0 0", fontSize: 13, color: "#666687", lineHeight: 1.45 }, children: it.description }) : null
        ] })
      ] }, it.uid)) })
    ] }, group.category)),
    active && catalog ? /* @__PURE__ */ jsxRuntime.jsx(Lightbox, { item: active, base: catalog.imageBaseUrl, onClose: () => setActive(null) }) : null
  ] });
};
exports.default = GalleryPage;
