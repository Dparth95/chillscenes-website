/* ============================================================
   CART — stored in localStorage under key "cs_cart"
   Shape: { "productId::variant": qty, ... }  (variant = "basic" | "premium")
   WHATSAPP NUMBER — change here if it ever changes
   ============================================================ */
const WHATSAPP_NUMBER = "919810704170"; // country code 91 + number

/* Delivery is NOT calculated automatically — it varies by weight & size
   and gets added when the order is confirmed on WhatsApp. We still
   capture the pincode (useful reference for whoever's confirming). */

/* ---------- CART KEY HELPERS (product + variant) ---------- */
function makeCartKey(productId, variant) {
  return `${productId}::${variant}`;
}
function parseCartKey(key) {
  const idx = key.lastIndexOf("::");
  return { productId: key.slice(0, idx), variant: key.slice(idx + 2) };
}
function getCartLineInfo(key) {
  const { productId, variant } = parseCartKey(key);
  const p = getProduct(productId);
  if (!p) return null;
  return { product: p, variant: variant, price: getVariantPrice(p.price, variant) };
}

/* Fires the order off to the Orders sheet — best-effort, never blocks
   checkout on failure or slowness. items: [{name, qty, price, imageId}] */
function logOrderToSheet(name, phone, pincode, items, total, couponCode, discountAmt) {
  if (typeof APPSCRIPT_URL === "undefined" || APPSCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;
  fetch(APPSCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "logOrder", name, phone, pincode, items, total, coupon: couponCode || "", discount: discountAmt || 0 })
  }).catch(() => {});
}

function readCart() {
  try { return JSON.parse(localStorage.getItem("cs_cart")) || {}; }
  catch (e) { return {}; }
}
function writeCart(cart) {
  localStorage.setItem("cs_cart", JSON.stringify(cart));
  updateCartCount();
}
function pruneCart() {
  if (!PRODUCTS.length) return; // catalog not loaded yet — don't wipe a valid cart
  const cart = readCart();
  let changed = false;
  Object.keys(cart).forEach(key => {
    if (!getCartLineInfo(key)) { delete cart[key]; changed = true; }
  });
  if (changed) writeCart(cart);
}
function clearCart() {
  localStorage.removeItem("cs_cart");
  updateCartCount();
  renderCartDrawer();
}
function addToCart(id, qty = 1, sourceImgEl = null, variant = "basic") {
  const cart = readCart();
  const key = makeCartKey(id, variant);
  cart[key] = (cart[key] || 0) + qty;
  writeCart(cart);
  renderCartDrawer();
  flyToCart(sourceImgEl);
}
function handleAddToCart(evt, id, qty = 1, variant = "basic") {
  const scope = evt.target.closest(".product-card, .pdp");
  const img = scope ? scope.querySelector("img") : null;
  addToCart(id, qty, img, variant);
}
function setQty(key, qty) {
  const cart = readCart();
  if (qty <= 0) delete cart[key];
  else cart[key] = qty;
  writeCart(cart);
  renderCartDrawer();
}
function removeFromCart(key) {
  const cart = readCart();
  delete cart[key];
  writeCart(cart);
  renderCartDrawer();
}
function cartCount() {
  return Object.values(readCart()).reduce((a, b) => a + b, 0);
}
function cartTotal() {
  const cart = readCart();
  return Object.entries(cart).reduce((sum, [key, qty]) => {
    const line = getCartLineInfo(key);
    return line ? sum + line.price * qty : sum;
  }, 0);
}
function updateCartCount() {
  document.querySelectorAll(".cart-count").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------- VARIANT PICKER POPUP (used by product cards) ---------- */
let variantPickerProductId = null;
function openVariantPicker(productId, btnEl) {
  const p = getProduct(productId);
  const popup = document.getElementById("variantPickerPopup");
  if (!p || !popup) return;
  variantPickerProductId = productId;

  const basicPrice = p.price;
  const premiumPrice = getVariantPrice(p.price, "premium");
  popup.innerHTML = `
    <div class="variant-picker-title">Choose quality</div>
    <button type="button" class="variant-option" data-variant="basic">
      <span>${VARIANT_INFO.basic.label}</span><span class="variant-price">₹${basicPrice}</span>
    </button>
    <button type="button" class="variant-option" data-variant="premium">
      <span>${VARIANT_INFO.premium.label}</span><span class="variant-price">₹${premiumPrice}</span>
    </button>`;

  popup.querySelectorAll(".variant-option").forEach(opt => {
    opt.addEventListener("click", () => {
      const variant = opt.dataset.variant;
      const card = btnEl.closest(".product-card");
      const img = card ? card.querySelector("img") : null;
      closeVariantPicker();
      addToCart(productId, 1, img, variant);
    });
  });

  const rect = btnEl.getBoundingClientRect();
  const popupWidth = 190;
  popup.style.top = (rect.bottom + window.scrollY + 6) + "px";
  popup.style.left = Math.min(rect.left, window.innerWidth - popupWidth - 12) + "px";
  popup.classList.add("open");
}
function closeVariantPicker() {
  document.getElementById("variantPickerPopup")?.classList.remove("open");
  variantPickerProductId = null;
}
document.addEventListener("click", e => {
  const popup = document.getElementById("variantPickerPopup");
  if (!popup) return;
  if (e.target.closest(".add-to-cart-btn")) return;
  if (popup.classList.contains("open") && !popup.contains(e.target)) closeVariantPicker();
});

/* ---------- COUPON ----------
   Session-only (in-memory), never saved to localStorage — a coupon should
   never silently reapply to a future order without being typed in again. */
let appliedCoupon = null;
function getAppliedCoupon() {
  return appliedCoupon;
}
function setAppliedCoupon(code, discount) {
  appliedCoupon = { code, discount };
}
function clearAppliedCoupon() {
  appliedCoupon = null;
  const input = document.getElementById("couponInput");
  const statusEl = document.getElementById("couponStatus");
  if (input) input.value = "";
  if (statusEl) { statusEl.textContent = ""; statusEl.className = "coupon-status"; }
}
function cartDiscountAmount(subtotal) {
  const coupon = getAppliedCoupon();
  return coupon ? Math.round(subtotal * coupon.discount / 100) : 0;
}
async function applyCoupon() {
  const input = document.getElementById("couponInput");
  const statusEl = document.getElementById("couponStatus");
  const code = (input?.value || "").trim();
  if (!code || !statusEl) return;
  if (typeof APPSCRIPT_URL === "undefined" || APPSCRIPT_URL.indexOf("PASTE_YOUR") === 0) return;

  statusEl.textContent = "Checking…";
  statusEl.className = "coupon-status";
  try {
    const res = await fetch(`${APPSCRIPT_URL}?action=coupon&code=${encodeURIComponent(code)}`);
    const data = await res.json();
    if (data.valid) {
      setAppliedCoupon(data.code, data.discount);
      statusEl.innerHTML = `Applied "${data.code}" — ${data.discount}% off &nbsp;<a href="#" id="removeCouponLink" class="coupon-remove-link">Remove</a>`;
      statusEl.className = "coupon-status ok";
      document.getElementById("removeCouponLink")?.addEventListener("click", e => {
        e.preventDefault();
        clearAppliedCoupon();
        renderCartDrawer();
      });
    } else {
      appliedCoupon = null;
      statusEl.textContent = "Invalid coupon code";
      statusEl.className = "coupon-status err";
    }
  } catch (e) {
    statusEl.textContent = "Couldn't check coupon — try again";
    statusEl.className = "coupon-status err";
  }
  renderCartDrawer();
}

/* ---------- FLY-TO-CART ANIMATION ---------- */
function flyToCart(imgEl) {
  const cartIcon = document.getElementById("cartToggle");
  if (!cartIcon) return;
  if (!imgEl) { bumpCartIcon(); return; }

  const imgRect = imgEl.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();
  const clone = imgEl.cloneNode(true);
  Object.assign(clone.style, {
    position: "fixed",
    left: imgRect.left + "px",
    top: imgRect.top + "px",
    width: imgRect.width + "px",
    height: imgRect.height + "px",
    borderRadius: "10px",
    zIndex: 99999,
    pointerEvents: "none",
    transition: "transform .6s cubic-bezier(.55,0,.85,.35), opacity .6s ease",
    objectFit: "cover"
  });
  document.body.appendChild(clone);

  requestAnimationFrame(() => {
    const dx = (cartRect.left + cartRect.width / 2) - (imgRect.left + imgRect.width / 2);
    const dy = (cartRect.top + cartRect.height / 2) - (imgRect.top + imgRect.height / 2);
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(.12)`;
    clone.style.opacity = ".2";
  });

  setTimeout(() => { clone.remove(); bumpCartIcon(); }, 600);
}
function bumpCartIcon() {
  const icon = document.getElementById("cartToggle");
  if (icon) { icon.classList.remove("bump"); void icon.offsetWidth; icon.classList.add("bump"); }
  document.querySelectorAll(".cart-count").forEach(el => {
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  });
}

/* ---------- CART DRAWER RENDER ---------- */
function renderCartDrawer() {
  const body = document.getElementById("cartBody");
  const footer = document.getElementById("cartFooter");
  if (!body) return;
  const cart = readCart();
  const keys = Object.keys(cart);

  if (keys.length === 0) {
    body.innerHTML = `<div class="cart-empty">Your cart is empty.<br><a href="shop.html">Browse products →</a></div>`;
    if (footer) footer.style.display = "none";
    return;
  }

  body.innerHTML = keys.map(key => {
    const line = getCartLineInfo(key);
    if (!line) return "";
    const qty = cart[key];
    const p = line.product;
    const variantLabel = VARIANT_INFO[line.variant]?.label || "Basic";
    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name}">
        <div class="cart-item-info">
          <h4>${p.name} <span class="cart-item-variant">${variantLabel}</span></h4>
          <span class="cart-item-price">₹${line.price}</span>
          <div class="qty-control">
            <button onclick="setQty('${key}', ${qty - 1})">−</button>
            <span>${qty}</span>
            <button onclick="setQty('${key}', ${qty + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${key}')" aria-label="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
  }).join("");

  if (footer) {
    footer.style.display = "block";
    const subtotal = cartTotal();
    const pin = localStorage.getItem("cs_pincode") || "";
    const phone = localStorage.getItem("cs_phone") || "";
    const name = localStorage.getItem("cs_name") || "";
    const pinInput = document.getElementById("pincodeInput");
    const phoneInput = document.getElementById("phoneInput");
    const nameInput = document.getElementById("nameInput");
    if (pinInput && document.activeElement !== pinInput) pinInput.value = pin;
    if (phoneInput && document.activeElement !== phoneInput) phoneInput.value = phone;
    if (nameInput && document.activeElement !== nameInput) nameInput.value = name;

    const coupon = getAppliedCoupon();
    const discountAmt = cartDiscountAmount(subtotal);
    const total = subtotal - discountAmt;

    const couponInput = document.getElementById("couponInput");
    if (couponInput && document.activeElement !== couponInput && coupon) couponInput.value = coupon.code;

    document.getElementById("cartSubtotal").textContent = "₹" + subtotal;
    const discountRow = document.getElementById("discountRow");
    if (coupon && discountAmt > 0) {
      if (discountRow) discountRow.style.display = "flex";
      const discountEl = document.getElementById("cartDiscount");
      if (discountEl) discountEl.textContent = `-₹${discountAmt} (${coupon.code})`;
    } else if (discountRow) {
      discountRow.style.display = "none";
    }
    document.getElementById("cartTotal").textContent = "₹" + total;
  }
}

/* ---------- WHATSAPP CHECKOUT ---------- */
function buildWhatsAppMessage() {
  const cart = readCart();
  const subtotal = cartTotal();
  const coupon = getAppliedCoupon();
  const discountAmt = cartDiscountAmount(subtotal);
  const total = subtotal - discountAmt;
  const pin = localStorage.getItem("cs_pincode") || "";
  const phone = localStorage.getItem("cs_phone") || "";
  const name = localStorage.getItem("cs_name") || "";
  const lines = ["Hi ChillScenes3D! I'd like to order:", ""];
  if (name) lines.push(`Name: ${name}`);
  if (phone) lines.push(`Phone: ${phone}`);
  if (name || phone) lines.push("");
  Object.entries(cart).forEach(([key, qty]) => {
    const line = getCartLineInfo(key);
    if (!line) return;
    const variantLabel = VARIANT_INFO[line.variant]?.label || "Basic";
    lines.push(`• ${line.product.name} (${variantLabel}) x${qty} — ₹${line.price * qty}`, `  ${location.origin}/product.html?id=${line.product.id}`);
  });
  lines.push("", `Subtotal: ₹${subtotal}`);
  if (coupon && discountAmt > 0) lines.push(`Coupon (${coupon.code}): -₹${discountAmt} (${coupon.discount}% off)`);
  lines.push(`Total: ₹${total}`);
  if (pin) lines.push(`Delivery Pincode: ${pin}`);
  lines.push("Delivery charge to be added separately based on weight & size — please confirm total.");
  lines.push("", "Please confirm availability & delivery.");
  return lines.join("\n");
}
function checkoutWhatsApp() {
  if (cartCount() === 0) return;
  const nameInput = document.getElementById("nameInput");
  const phoneInput = document.getElementById("phoneInput");
  const name = (nameInput?.value || "").trim();
  const phone = (phoneInput?.value || "").trim();
  if (!name) { alert("Please enter your name before checkout."); nameInput?.focus(); return; }
  if (!phone) { alert("Please enter your phone number before checkout."); phoneInput?.focus(); return; }
  localStorage.setItem("cs_name", name);
  localStorage.setItem("cs_phone", phone);

  const subtotal = cartTotal();
  const coupon = getAppliedCoupon();
  const discountAmt = cartDiscountAmount(subtotal);
  const total = subtotal - discountAmt;

  const cart = readCart();
  const itemsForLog = Object.entries(cart).map(([key, qty]) => {
    const line = getCartLineInfo(key);
    if (!line) return null;
    const variantLabel = VARIANT_INFO[line.variant]?.label || "Basic";
    return { name: `${line.product.name} (${variantLabel})`, qty, price: line.price, imageId: line.product.imageId };
  }).filter(Boolean);
  logOrderToSheet(name, phone, localStorage.getItem("cs_pincode") || "", itemsForLog, total, coupon ? coupon.code : "", discountAmt);

  const msg = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}
function buyNowWhatsApp(id, variant = "basic") {
  const p = getProduct(id);
  if (!p) return;
  const price = getVariantPrice(p.price, variant);
  const variantLabel = VARIANT_INFO[variant]?.label || "Basic";
  const nameEl = document.getElementById("pdpName");
  const phoneEl = document.getElementById("pdpPhone");
  const name = (nameEl?.value || localStorage.getItem("cs_name") || "").trim();
  const phone = (phoneEl?.value || localStorage.getItem("cs_phone") || "").trim();
  if (!name) { alert("Please enter your name before ordering."); nameEl?.focus(); return; }
  if (!phone) { alert("Please enter your phone number before ordering."); phoneEl?.focus(); return; }
  localStorage.setItem("cs_name", name);
  localStorage.setItem("cs_phone", phone);

  logOrderToSheet(name, phone, localStorage.getItem("cs_pincode") || "", [{ name: `${p.name} (${variantLabel})`, qty: 1, price: price, imageId: p.imageId }], price, "", 0);

  const msg = encodeURIComponent(
    `Hi ChillScenes3D! I'd like to order:\n\nName: ${name}\nPhone: ${phone}\n• ${p.name} (${variantLabel}) x1 — ₹${price}\n  ${location.origin}/product.html?id=${p.id}\n\nDelivery charge to be added separately based on weight & size — please confirm total.\n\nPlease confirm availability & delivery.`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

let scrollLockY = 0;
function openCart() {
  document.getElementById("cartDrawer")?.classList.add("active");
  document.getElementById("cartOverlay")?.classList.add("active");
  scrollLockY = window.scrollY;
  document.body.style.top = -scrollLockY + "px";
  document.body.classList.add("scroll-locked");
}
function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("active");
  document.getElementById("cartOverlay")?.classList.remove("active");
  document.body.classList.remove("scroll-locked");
  document.body.style.top = "";
  window.scrollTo(0, scrollLockY);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCartDrawer();
  document.getElementById("cartToggle")?.addEventListener("click", openCart);
  document.getElementById("cartClose")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);
  document.getElementById("checkoutBtn")?.addEventListener("click", checkoutWhatsApp);
  document.getElementById("clearCartBtn")?.addEventListener("click", () => {
    if (cartCount() === 0) return;
    if (confirm("Clear all items from your cart?")) clearCart();
  });
  document.getElementById("applyCouponBtn")?.addEventListener("click", applyCoupon);
  document.getElementById("couponInput")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); applyCoupon(); }
  });
  document.getElementById("pincodeInput")?.addEventListener("input", e => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    e.target.value = val;
    localStorage.setItem("cs_pincode", val);
    renderCartDrawer();
  });
  document.getElementById("phoneInput")?.addEventListener("input", e => {
    localStorage.setItem("cs_phone", e.target.value.trim());
  });
  document.getElementById("nameInput")?.addEventListener("input", e => {
    localStorage.setItem("cs_name", e.target.value.trim());
  });
});
document.addEventListener("catalog:updated", () => { pruneCart(); renderCartDrawer(); });
