/* ============================================================
   CART — stored in localStorage under key "cs_cart"
   Shape: { "product-id": qty, ... }
   WHATSAPP NUMBER — change here if it ever changes
   ============================================================ */
const WHATSAPP_NUMBER = "919810704170"; // country code 91 + number

/* Delivery is NOT calculated automatically — it varies by weight & size
   and gets added when the order is confirmed on WhatsApp. We still
   capture the pincode (useful reference for whoever's confirming). */

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
  Object.keys(cart).forEach(id => {
    if (!getProduct(id)) { delete cart[id]; changed = true; }
  });
  if (changed) writeCart(cart);
}
function clearCart() {
  localStorage.removeItem("cs_cart");
  updateCartCount();
  renderCartDrawer();
}
function addToCart(id, qty = 1, sourceImgEl = null) {
  const cart = readCart();
  cart[id] = (cart[id] || 0) + qty;
  writeCart(cart);
  renderCartDrawer();
  flyToCart(sourceImgEl);
}
function handleAddToCart(evt, id, qty = 1) {
  const scope = evt.target.closest(".product-card, .pdp");
  const img = scope ? scope.querySelector("img") : null;
  addToCart(id, qty, img);
}
function setQty(id, qty) {
  const cart = readCart();
  if (qty <= 0) delete cart[id];
  else cart[id] = qty;
  writeCart(cart);
  renderCartDrawer();
}
function removeFromCart(id) {
  const cart = readCart();
  delete cart[id];
  writeCart(cart);
  renderCartDrawer();
}
function cartCount() {
  return Object.values(readCart()).reduce((a, b) => a + b, 0);
}
function cartTotal() {
  const cart = readCart();
  return Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = getProduct(id);
    return p ? sum + p.price * qty : sum;
  }, 0);
}
function updateCartCount() {
  document.querySelectorAll(".cart-count").forEach(el => {
    const n = cartCount();
    el.textContent = n;
    el.style.display = n > 0 ? "flex" : "none";
  });
}

/* ---------- COUPON ---------- */
function getAppliedCoupon() {
  const code = localStorage.getItem("cs_coupon_code") || "";
  const discount = Number(localStorage.getItem("cs_coupon_discount") || 0);
  return code ? { code, discount } : null;
}
function setAppliedCoupon(code, discount) {
  localStorage.setItem("cs_coupon_code", code);
  localStorage.setItem("cs_coupon_discount", discount);
}
function clearAppliedCoupon() {
  localStorage.removeItem("cs_coupon_code");
  localStorage.removeItem("cs_coupon_discount");
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
      statusEl.textContent = `Applied "${data.code}" — ${data.discount}% off`;
      statusEl.className = "coupon-status ok";
    } else {
      clearAppliedCoupon();
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
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    body.innerHTML = `<div class="cart-empty">Your cart is empty.<br><a href="shop.html">Browse products →</a></div>`;
    if (footer) footer.style.display = "none";
    return;
  }

  body.innerHTML = ids.map(id => {
    const p = getProduct(id);
    if (!p) return "";
    const qty = cart[id];
    return `
      <div class="cart-item">
        <img src="${p.image}" alt="${p.name}">
        <div class="cart-item-info">
          <h4>${p.name}</h4>
          <span class="cart-item-price">₹${p.price}</span>
          <div class="qty-control">
            <button onclick="setQty('${id}', ${qty - 1})">−</button>
            <span>${qty}</span>
            <button onclick="setQty('${id}', ${qty + 1})">+</button>
          </div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${id}')" aria-label="Remove">
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
  Object.entries(cart).forEach(([id, qty]) => {
    const p = getProduct(id);
    if (p) lines.push(`• ${p.name} x${qty} — ₹${p.price * qty}`, `  ${location.origin}/product.html?id=${p.id}`);
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
  const itemsForLog = Object.entries(cart).map(([id, qty]) => {
    const p = getProduct(id);
    return p ? { name: p.name, qty, price: p.price, imageId: p.imageId } : null;
  }).filter(Boolean);
  logOrderToSheet(name, phone, localStorage.getItem("cs_pincode") || "", itemsForLog, total, coupon ? coupon.code : "", discountAmt);

  const msg = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}
function buyNowWhatsApp(id) {
  const p = getProduct(id);
  if (!p) return;
  const nameEl = document.getElementById("pdpName");
  const phoneEl = document.getElementById("pdpPhone");
  const name = (nameEl?.value || localStorage.getItem("cs_name") || "").trim();
  const phone = (phoneEl?.value || localStorage.getItem("cs_phone") || "").trim();
  if (!name) { alert("Please enter your name before ordering."); nameEl?.focus(); return; }
  if (!phone) { alert("Please enter your phone number before ordering."); phoneEl?.focus(); return; }
  localStorage.setItem("cs_name", name);
  localStorage.setItem("cs_phone", phone);

  logOrderToSheet(name, phone, localStorage.getItem("cs_pincode") || "", [{ name: p.name, qty: 1, price: p.price, imageId: p.imageId }], p.price, "", 0);

  const msg = encodeURIComponent(
    `Hi ChillScenes3D! I'd like to order:\n\nName: ${name}\nPhone: ${phone}\n• ${p.name} x1 — ₹${p.price}\n  ${location.origin}/product.html?id=${p.id}\n\nDelivery charge to be added separately based on weight & size — please confirm total.\n\nPlease confirm availability & delivery.`
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

function openCart() {
  document.getElementById("cartDrawer")?.classList.add("active");
  document.getElementById("cartOverlay")?.classList.add("active");
}
function closeCart() {
  document.getElementById("cartDrawer")?.classList.remove("active");
  document.getElementById("cartOverlay")?.classList.remove("active");
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
