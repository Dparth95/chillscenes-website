/* ============================================================
   PRODUCT CATALOG — loaded live from your Google Sheet via the
   Apps Script Web App (see js/config.js). Cached in localStorage
   so the site paints instantly, then refreshes in the background.
   ============================================================ */

let CATEGORIES = [];
let PRODUCTS = [];
let DELIVERY_RATES = {};
const DEFAULT_DELIVERY = 79; // fallback if a state has no rate set yet

/* All states/zones delivery pricing can be set for — used by
   admin.html's Delivery Prices panel and cart.js's pincode lookup. */
const ALL_STATES = [
  "Delhi", "Haryana", "Punjab", "Himachal Pradesh", "Jammu and Kashmir",
  "Uttar Pradesh", "Uttarakhand", "Rajasthan", "Gujarat", "Maharashtra",
  "Madhya Pradesh", "Chhattisgarh", "Telangana", "Andhra Pradesh", "Karnataka",
  "Tamil Nadu", "Kerala", "West Bengal", "Odisha", "Bihar", "Jharkhand",
  "Assam", "North East"
];

const CATALOG_CACHE_KEY = "cs_catalog_cache";

function applyCatalog(data) {
  CATEGORIES.length = 0; CATEGORIES.push(...(data.categories || []));
  PRODUCTS.length = 0; PRODUCTS.push(...(data.products || []));
  DELIVERY_RATES = {};
  (data.deliveryRates || []).forEach(r => { DELIVERY_RATES[r.state] = r.price; });
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
  if (typeof APPSCRIPT_URL === "undefined" || APPSCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;
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
