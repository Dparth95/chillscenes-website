/* ============================================================
   PRODUCT CATALOG — loaded live from your Google Sheet via the
   Apps Script Web App (see js/config.js). Cached in localStorage
   so the site paints instantly, then refreshes in the background.
   ============================================================ */

/* Fallback categories shown even before the Sheet has any —
   real categories from the Sheet are merged in on top of these. */
const DEFAULT_CATEGORIES = [
  { slug: "fridge-magnets",       name: "Fridge Magnets",         icon: "🧲" },
  { slug: "bathroom-organisers",  name: "Bathroom Organisers",    icon: "🧴" },
  { slug: "office-organisers",    name: "Office Table Organisers",icon: "🗂️" },
  { slug: "board-games",          name: "Board Games",            icon: "♟️" },
  { slug: "keyrings",             name: "Key Rings",               icon: "🔑" },
  { slug: "anime",                name: "Anime Products",          icon: "🎌" },
];

let CATEGORIES = [...DEFAULT_CATEGORIES];
let PRODUCTS = [];

const CATALOG_CACHE_KEY = "cs_catalog_cache";

function applyCatalog(data) {
  const fetchedCats = data.categories || [];
  const merged = [...DEFAULT_CATEGORIES];
  fetchedCats.forEach(c => {
    if (!merged.find(m => m.slug === c.slug)) merged.push(c);
  });
  CATEGORIES.length = 0; CATEGORIES.push(...merged);
  PRODUCTS.length = 0; PRODUCTS.push(...(data.products || []));
}

// 1. Instant paint from cache (synchronous, runs before DOMContentLoaded)
(function loadCacheSync() {
  try {
    const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY));
    if (cached && cached.data) applyCatalog(cached.data);
  } catch (e) { /* no cache yet */ }
})();

// 2. Background refresh from the live Sheet
async function refreshCatalog() {
  if (!APPSCRIPT_URL || APPSCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;
  try {
    const res = await fetch(`${APPSCRIPT_URL}?action=catalog`);
    const data = await res.json();
    applyCatalog(data);
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    document.dispatchEvent(new CustomEvent("catalog:updated"));
  } catch (e) {
    console.warn("Catalog refresh failed:", e);
  }
}

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}
function getCategory(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}

document.addEventListener("DOMContentLoaded", refreshCatalog);
