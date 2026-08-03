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
          <button class="btn btn-outline" onclick="handleAddToCart(event, '${p.id}')">Add to Cart</button>
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
      <div class="pdp-price">₹${p.price}</div>
      <p class="desc">${p.desc}</p>
      <div class="pdp-qty">
        <div class="qty-control">
          <button id="qtyMinus">−</button>
          <span id="qtyVal">1</span>
          <button id="qtyPlus">+</button>
        </div>
      </div>
      <div class="pdp-actions">
        <button class="btn btn-outline" id="pdpAddCart">Add to Cart</button>
        <button class="btn" id="pdpBuyNow">Buy Now</button>
      </div>
    </div>`;

  let qty = 1;
  document.getElementById("qtyMinus").onclick = () => { qty = Math.max(1, qty - 1); document.getElementById("qtyVal").textContent = qty; };
  document.getElementById("qtyPlus").onclick = () => { qty += 1; document.getElementById("qtyVal").textContent = qty; };
  document.getElementById("pdpAddCart").onclick = (e) => handleAddToCart(e, p.id, qty);
  document.getElementById("pdpBuyNow").onclick = () => buyNowWhatsApp(p.id);

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
  document.getElementById("featuredSort")?.addEventListener("change", renderFeatured);
  document.getElementById("shopSort")?.addEventListener("change", renderShop);
});
document.addEventListener("catalog:updated", renderAll);
