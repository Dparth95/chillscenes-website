/* ============================================================
   CART — stored in localStorage under key "cs_cart"
   Shape: { "product-id": qty, ... }
   WHATSAPP NUMBER — change here if it ever changes
   ============================================================ */
const WHATSAPP_NUMBER = "919810704170"; // country code 91 + number

/* Delivery is NOT calculated automatically — it varies by weight & size
   and gets added when the order is confirmed on WhatsApp. We still
   capture the pincode (useful reference for whoever's confirming). */

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
    const pinInput = document.getElementById("pincodeInput");
    if (pinInput && document.activeElement !== pinInput) pinInput.value = pin;
    document.getElementById("cartTotal").textContent = "₹" + subtotal;
  }
}

/* ---------- WHATSAPP CHECKOUT ---------- */
function buildWhatsAppMessage() {
  const cart = readCart();
  const subtotal = cartTotal();
  const pin = localStorage.getItem("cs_pincode") || "";
  const lines = ["Hi ChillScenes3D! I'd like to order:", ""];
  Object.entries(cart).forEach(([id, qty]) => {
    const p = getProduct(id);
    if (p) lines.push(`• ${p.name} x${qty} — ₹${p.price * qty}`, `  ${location.origin}/product.html?id=${p.id}`);
  });
  lines.push("", `Total: ₹${subtotal}`);
  if (pin) lines.push(`Delivery Pincode: ${pin}`);
  lines.push("Delivery charge to be added separately based on weight & size — please confirm total.");
  lines.push("", "Please confirm availability & delivery.");
  return lines.join("\n");
}
function checkoutWhatsApp() {
  if (cartCount() === 0) return;
  const msg = encodeURIComponent(buildWhatsAppMessage());
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}
function buyNowWhatsApp(id) {
  const p = getProduct(id);
  if (!p) return;
  const msg = encodeURIComponent(
    `Hi ChillScenes3D! I'd like to order:\n\n• ${p.name} x1 — ₹${p.price}\n  ${location.origin}/product.html?id=${p.id}\n\nDelivery charge to be added separately based on weight & size — please confirm total.\n\nPlease confirm availability & delivery.`
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
  document.getElementById("pincodeInput")?.addEventListener("input", e => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    e.target.value = val;
    localStorage.setItem("cs_pincode", val);
    renderCartDrawer();
  });
});
document.addEventListener("catalog:updated", () => { pruneCart(); renderCartDrawer(); });
