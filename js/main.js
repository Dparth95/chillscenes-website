/* ---------- PRODUCT CARD TEMPLATE ---------- */
function productCard(p) {
  return `
    <div class="product-card reveal">
      <a href="product.html?id=${p.id}" class="product-thumb">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        <div class="layers"><div></div><div></div><div></div></div>
      </a>
      <div class="product-body">
        <span class="product-cat">${getCategory(p.category)?.name || ""}</span>
        <h3><a href="product.html?id=${p.id}">${p.name}</a></h3>
        <div class="product-price">₹${p.price}</div>
        <div class="product-actions">
          <button class="btn btn-outline" onclick="handleAddToCart(event, '${p.id}')">Add to Cart</button>
        </div>
      </div>
    </div>`;
}

/* ---------- HOMEPAGE ---------- */
function renderCategoryGrid() {
  const el = document.getElementById("categoryGrid");
  if (!el) return;
  el.innerHTML = CATEGORIES.map(c => {
    const count = PRODUCTS.filter(p => p.category === c.slug).length;
    return `
      <a href="shop.html?category=${c.slug}" class="cat-card reveal">
        <span class="cat-icon">${c.icon}</span>
        <h3>${c.name}</h3>
        <span class="count">${count} items</span>
      </a>`;
  }).join("");
}
function renderFeatured() {
  const el = document.getElementById("featuredGrid");
  if (!el) return;
  el.innerHTML = PRODUCTS.filter(p => p.featured).map(productCard).join("");
}

/* ---------- SHOP PAGE ---------- */
function renderShop() {
  const grid = document.getElementById("shopGrid");
  const tabsEl = document.getElementById("categoryTabs");
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  let active = params.get("category") || "all";

  function draw() {
    tabsEl.innerHTML = ["all", ...CATEGORIES.map(c => c.slug)].map(slug => {
      const label = slug === "all" ? "All" : getCategory(slug).name;
      return `<button class="tab ${slug === active ? "active" : ""}" data-slug="${slug}">${label}</button>`;
    }).join("");

    const items = active === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === active);
    grid.innerHTML = items.length
      ? items.map(productCard).join("")
      : `<p style="color:var(--gray)">No products in this category yet.</p>`;

    tabsEl.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        active = btn.dataset.slug;
        const url = new URL(location);
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
  document.title = p.name + " — ChillPrints";

  wrap.innerHTML = `
    <div class="pdp-image reveal in"><img src="${p.image}" alt="${p.name}"></div>
    <div class="pdp-info reveal in">
      <div class="breadcrumb">
        <a href="index.html">Home</a> / <a href="shop.html?category=${p.category}">${getCategory(p.category).name}</a>
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
        <button class="btn" id="pdpBuyNow"><i class="fa-brands fa-whatsapp"></i>&nbsp; Buy on WhatsApp</button>
      </div>
    </div>`;

  let qty = 1;
  document.getElementById("qtyMinus").onclick = () => { qty = Math.max(1, qty - 1); document.getElementById("qtyVal").textContent = qty; };
  document.getElementById("qtyPlus").onclick = () => { qty += 1; document.getElementById("qtyVal").textContent = qty; };
  document.getElementById("pdpAddCart").onclick = (e) => handleAddToCart(e, p.id, qty);
  document.getElementById("pdpBuyNow").onclick = () => buyNowWhatsApp(p.id);

  // related products
  const relWrap = document.getElementById("relatedGrid");
  if (relWrap) {
    const rel = PRODUCTS.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
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
});
document.addEventListener("catalog:updated", renderAll);
