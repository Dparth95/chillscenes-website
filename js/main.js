/* ---------- PRODUCT CARD TEMPLATE ---------- */
function productCard(p) {
  const catLabel = p.categories.map(slug => getCategory(slug)?.name).filter(Boolean).join(" • ");
  return `
    <div class="product-card reveal">
      <a href="product.html?id=${p.id}" class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="layers"><div></div><div></div><div></div></div>
      </a>
      <div class="product-body">
        <span class="product-cat">${catLabel}</span>
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="product-price">₹${p.price}</div>
        <div class="product-actions">
          <button class="btn btn-outline add-to-cart-btn" data-id="${p.id}" onclick="openVariantPicker('${p.id}', this)">Add to Cart</button>
        </div>
      </div>
    </div>`;
}

/* Only categories with at least one product show on the live site —
   admin.html still sees every category (it needs to, to assign the first
   product to a brand-new one). */
function categoriesInUse() {
  const used = new Set();
  PRODUCTS.forEach(p => p.categories.forEach(c => used.add(c)));
  return CATEGORIES.filter(c => used.has(c.slug));
}

/* ---------- HOMEPAGE ---------- */
function renderCategoryGrid() {
  const el = document.getElementById("categoryGrid");
  if (!el) return;
  el.innerHTML = categoriesInUse().map(c => {
    const count = PRODUCTS.filter(p => p.categories.includes(c.slug)).length;
    return `
      <a href="shop.html?category=${c.slug}" class="cat-card reveal">
        <span class="cat-icon">${c.icon}</span>
        <h3>${c.name}</h3>
        <span class="count">${count} items</span>
      </a>`;
  }).join("");
}
/* ---------- SORTING ---------- */
function sortProducts(list, sortKey) {
  const arr = [...list];
  if (sortKey === "price-asc") arr.sort((a, b) => a.price - b.price);
  else if (sortKey === "price-desc") arr.sort((a, b) => b.price - a.price);
  else if (sortKey === "oldest") arr.sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));
  else arr.sort((a, b) => new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0)); // newest (default)
  return arr;
}

function renderFeatured() {
  const el = document.getElementById("featuredGrid");
  if (!el) return;
  const sortKey = document.getElementById("featuredSort")?.value || "newest";
  const items = sortProducts(PRODUCTS.filter(p => p.featured), sortKey);
  el.innerHTML = items.map(productCard).join("");
  initReveal();
}

/* ---------- SHOP PAGE ---------- */
function renderShop() {
  const grid = document.getElementById("shopGrid");
  const tabsEl = document.getElementById("categoryTabs");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const searchTerm = params.get("search");
  let active = params.get("category") || "all";

  function draw() {
    const sortKey = document.getElementById("shopSort")?.value || "newest";

    if (searchTerm) {
      tabsEl.innerHTML = "";
      const q = searchTerm.toLowerCase();
      const matches = PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
      const matchedCats = categoriesInUse().filter(c => c.name.toLowerCase().includes(q));
      const sorted = sortProducts(matches, sortKey);

      const chips = matchedCats.length
        ? `<div class="search-cat-chips">${matchedCats.map(c => `<a href="shop.html?category=${c.slug}" class="cat-chip">${c.icon} ${c.name}</a>`).join("")}</div>`
        : "";
      grid.innerHTML = chips + (sorted.length
        ? sorted.map(productCard).join("")
        : `<p style="color:var(--gray)">No products found for "${searchTerm}".</p>`);
      initReveal();
      return;
    }

    tabsEl.innerHTML = ["all", ...categoriesInUse().map(c => c.slug)].map(slug => {
      const label = slug === "all" ? "All" : getCategory(slug).name;
      return `<button class="tab ${slug === active ? "active" : ""}" data-slug="${slug}">${label}</button>`;
    }).join("");

    const items = active === "all" ? PRODUCTS : PRODUCTS.filter(p => p.categories.includes(active));
    const sorted = sortProducts(items, sortKey);
    grid.innerHTML = sorted.length
      ? sorted.map(productCard).join("")
      : `<p style="color:var(--gray)">No products in this category yet.</p>`;

    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        active = btn.dataset.slug;
        const url = new URL(location);
        url.searchParams.delete("search");
        active === "all" ? url.searchParams.delete("category") : url.searchParams.set("category", active);
        history.pushState({}, "", url);
        draw();
        initReveal();
      });
    });
    initReveal();
  }
  draw();
}

/* ---------- PRODUCT DETAIL PAGE ---------- */
function renderProductDetail() {
  const wrap = document.getElementById("pdpWrap");
  if (!wrap) return;
  const id = new URLSearchParams(location.search).get("id");
  const p = getProduct(id);

  if (!p) {
    wrap.innerHTML = `<p>Product not found. <a href="shop.html" style="color:var(--orange)">Back to shop</a></p>`;
    return;
  }
  document.title = p.name + " — ChillScenes3D";

  const catLinks = p.categories.map(slug => {
    const c = getCategory(slug);
    return c ? `<a href="shop.html?category=${slug}">${c.name}</a>` : "";
  }).filter(Boolean).join(" / ");

  wrap.innerHTML = `
    <div class="pdp-image reveal in"><img src="${p.image}" alt="${p.name}"></div>
    <div class="pdp-info reveal in">
      <div class="breadcrumb">
        <a href="index.html">Home</a>${catLinks ? " / " + catLinks : ""}
      </div>
      <h1>${p.name}</h1>
      <div class="pdp-price" id="pdpPrice">₹${p.price}</div>
      <div class="variant-tabs">
        <button type="button" class="variant-tab active" data-variant="basic">Basic</button>
        <button type="button" class="variant-tab" data-variant="premium">Premium</button>
      </div>
      <p class="variant-desc" id="pdpVariantDesc">${VARIANT_INFO.basic.desc}</p>
      <p class="desc">${p.desc}</p>
      <div class="pdp-qty">
        <div class="qty-control">
          <button id="qtyMinus">−</button>
          <span id="qtyVal">1</span>
          <button id="qtyPlus">+</button>
        </div>
      </div>
      <div class="field" style="margin-bottom:14px;">
        <label style="display:block; font-size:.8rem; color:var(--gray); margin-bottom:8px;">Name <span style="color:var(--gray); font-weight:400;">(needed for Buy Now)</span></label>
        <input type="text" id="pdpName" placeholder="Your name" value="${localStorage.getItem("cs_name") || ""}"
          style="width:100%; padding:13px 16px; border-radius:10px; background:var(--card); border:1px solid var(--border); color:var(--cream); font-family:inherit; font-size:.95rem;">
      </div>
      <div class="field" style="margin-bottom:20px;">
        <label style="display:block; font-size:.8rem; color:var(--gray); margin-bottom:8px;">Phone Number <span style="color:var(--gray); font-weight:400;">(needed for Buy Now)</span></label>
        <input type="tel" id="pdpPhone" placeholder="Your phone number" value="${localStorage.getItem("cs_phone") || ""}"
          style="width:100%; padding:13px 16px; border-radius:10px; background:var(--card); border:1px solid var(--border); color:var(--cream); font-family:inherit; font-size:.95rem;">
      </div>
      <div class="pdp-actions">
        <button class="btn btn-outline" id="pdpAddCart">Add to Cart</button>
        <button class="btn" id="pdpBuyNow">Buy Now</button>
      </div>
    </div>`;

  let qty = 1;
  let selectedVariant = "basic";
  document.getElementById("qtyMinus").onclick = () => { qty = Math.max(1, qty - 1); document.getElementById("qtyVal").textContent = qty; };
  document.getElementById("qtyPlus").onclick = () => { qty += 1; document.getElementById("qtyVal").textContent = qty; };
  document.getElementById("pdpAddCart").onclick = (e) => handleAddToCart(e, p.id, qty, selectedVariant);
  document.getElementById("pdpBuyNow").onclick = () => buyNowWhatsApp(p.id, selectedVariant);
  wrap.querySelectorAll(".variant-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      selectedVariant = tab.dataset.variant;
      wrap.querySelectorAll(".variant-tab").forEach(t => t.classList.toggle("active", t === tab));
      document.getElementById("pdpPrice").textContent = "₹" + getVariantPrice(p.price, selectedVariant);
      document.getElementById("pdpVariantDesc").textContent = VARIANT_INFO[selectedVariant].desc;
    });
  });
  document.getElementById("pdpPhone")?.addEventListener("input", e => {
    localStorage.setItem("cs_phone", e.target.value.trim());
  });
  document.getElementById("pdpName")?.addEventListener("input", e => {
    localStorage.setItem("cs_name", e.target.value.trim());
  });

  // related products — share at least one category
  const relWrap = document.getElementById("relatedGrid");
  if (relWrap) {
    const rel = PRODUCTS.filter(x => x.id !== p.id && x.categories.some(c => p.categories.includes(c))).slice(0, 4);
    relWrap.innerHTML = rel.map(productCard).join("");
  }
}

/* ---------- MOBILE MENU ---------- */
function initMobileMenu() {
  document.getElementById("menuBtn")?.addEventListener("click", () => {
    document.getElementById("mobileMenu")?.classList.add("active");
    document.getElementById("menuOverlay")?.classList.add("active");
  });
  document.getElementById("menuOverlay")?.addEventListener("click", () => {
    document.getElementById("mobileMenu")?.classList.remove("active");
    document.getElementById("menuOverlay")?.classList.remove("active");
  });
}

/* ---------- SCROLL REVEAL ---------- */
function initReveal() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));
}

/* ---------- SEARCH ---------- */
function performSearch(term) {
  const q = term.trim().toLowerCase();
  if (!q) return { products: [], categories: [] };
  const products = PRODUCTS.filter(p => p.name.toLowerCase().includes(q));
  const categories = categoriesInUse().filter(c => c.name.toLowerCase().includes(q));
  return { products, categories };
}

function renderSearchDropdown(container, term) {
  const dropdown = container.querySelector(".search-dropdown");
  if (!dropdown) return;
  const q = term.trim();
  if (!q) { dropdown.innerHTML = ""; dropdown.classList.remove("active"); return; }

  const { products, categories } = performSearch(q);
  if (!products.length && !categories.length) {
    dropdown.innerHTML = `<div class="search-empty">No results for "${q}"</div>`;
    dropdown.classList.add("active");
    return;
  }

  let html = "";
  if (products.length) {
    html += `<div class="search-section-label">Products</div>`;
    html += products.slice(0, 5).map(p => `
      <a href="product.html?id=${p.id}" class="search-result-item">
        <img src="${p.image}" alt="${p.name}">
        <div><div class="sr-name">${p.name}</div><div class="sr-price">₹${p.price}</div></div>
      </a>`).join("");
  }
  if (categories.length) {
    html += `<div class="search-section-label">Categories</div>`;
    html += categories.map(c => `
      <a href="shop.html?category=${c.slug}" class="search-result-item">
        <span class="search-cat-icon">${c.icon}</span>
        <div class="sr-name">${c.name}</div>
      </a>`).join("");
  }
  if (products.length > 5) {
    html += `<a href="shop.html?search=${encodeURIComponent(q)}" class="search-view-all">View all ${products.length} results for "${q}" →</a>`;
  }
  dropdown.innerHTML = html;
  dropdown.classList.add("active");
}

function initSearch() {
  document.querySelectorAll(".nav-search").forEach(container => {
    const input = container.querySelector(".nav-search-input");
    const dropdown = container.querySelector(".search-dropdown");
    if (!input) return;
    input.addEventListener("input", () => renderSearchDropdown(container, input.value));
    input.addEventListener("focus", () => { if (input.value.trim()) renderSearchDropdown(container, input.value); });
    input.addEventListener("keydown", e => {
      if (e.key === "Enter" && input.value.trim()) {
        window.location.href = `shop.html?search=${encodeURIComponent(input.value.trim())}`;
      }
    });
    document.addEventListener("click", e => {
      if (!container.contains(e.target)) dropdown.classList.remove("active");
    });
  });
}

/* ---------- VISIT TRACKING + WELCOME POPUP ---------- */
function getDeviceId() {
  let id = localStorage.getItem("cs_device_id");
  if (!id) {
    id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : ("d-" + Date.now() + "-" + Math.random().toString(36).slice(2));
    localStorage.setItem("cs_device_id", id);
  }
  return id;
}
function trackSiteView() {
  if (typeof APPSCRIPT_URL === "undefined" || APPSCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;
  // One visit per browsing session — otherwise every page load (home → shop →
  // product → product) would inflate a single visit into five.
  if (sessionStorage.getItem("cs_visit_logged")) return;
  sessionStorage.setItem("cs_visit_logged", "1");
  const phone = localStorage.getItem("cs_phone") || "";
  fetch(`${APPSCRIPT_URL}?action=trackView&deviceId=${encodeURIComponent(getDeviceId())}&phone=${encodeURIComponent(phone)}`).catch(() => {});
}

const WELCOME_DELAY_MS = 25000;      // let them browse first
const SKIP_SNOOZE_DAYS = 1;          // if they skip, ask again tomorrow

function shouldShowWelcome() {
  if (localStorage.getItem("cs_name") && localStorage.getItem("cs_phone")) return false;
  const snoozed = Number(localStorage.getItem("cs_welcome_snooze") || 0);
  if (snoozed && Date.now() < snoozed) return false;
  return true;
}
function snoozeWelcome() {
  localStorage.setItem("cs_welcome_snooze", String(Date.now() + SKIP_SNOOZE_DAYS * 86400000));
}
function saveVisitorDetails(name, phone) {
  localStorage.setItem("cs_name", name);
  localStorage.setItem("cs_phone", phone);
  if (typeof APPSCRIPT_URL === "undefined" || APPSCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;
  fetch(APPSCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "saveVisitor", deviceId: getDeviceId(), name, phone })
  }).catch(() => {});
}

function showWelcomePopup() {
  if (!shouldShowWelcome()) return;
  const el = document.getElementById("welcomeModal");
  if (!el) return;
  el.classList.add("active");

  const close = () => el.classList.remove("active");
  el.querySelector("#welcomeSkip").onclick = () => { snoozeWelcome(); close(); };
  el.querySelector("#welcomeOverlay").onclick = () => { snoozeWelcome(); close(); };
  el.querySelector("#welcomeSave").onclick = () => {
    const name = el.querySelector("#welcomeName").value.trim();
    const phone = el.querySelector("#welcomePhone").value.trim();
    if (!name || !phone) { el.querySelector("#welcomeErr").textContent = "Please add both, or tap Skip."; return; }
    saveVisitorDetails(name, phone);
    close();
    renderCartDrawer(); // pick up the autofilled details right away
  };
}

function initWelcomePopup() {
  if (!shouldShowWelcome()) return;
  let fired = false;
  const fire = () => { if (!fired) { fired = true; showWelcomePopup(); } };
  setTimeout(fire, WELCOME_DELAY_MS);
  // …or as soon as they've scrolled a bit, whichever comes first
  const onScroll = () => {
    if (window.scrollY > window.innerHeight * 1.2) { window.removeEventListener("scroll", onScroll); fire(); }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

function renderAll() {
  renderCategoryGrid();
  renderFeatured();
  renderShop();
  renderProductDetail();
  initReveal();
}

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  initMobileMenu();
  initSearch();
  trackSiteView();
  initWelcomePopup();
  document.getElementById("featuredSort")?.addEventListener("change", renderFeatured);
  document.getElementById("shopSort")?.addEventListener("change", renderShop);
  document.getElementById("featuredPrev")?.addEventListener("click", () => {
    document.getElementById("featuredGrid")?.scrollBy({ left: -document.getElementById("featuredGrid").clientWidth, behavior: "smooth" });
  });
  document.getElementById("featuredNext")?.addEventListener("click", () => {
    document.getElementById("featuredGrid")?.scrollBy({ left: document.getElementById("featuredGrid").clientWidth, behavior: "smooth" });
  });
});
document.addEventListener("catalog:updated", renderAll);
