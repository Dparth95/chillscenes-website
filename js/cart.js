/* ============================================================
   CART — stored in localStorage under key "cs_cart"
   Shape: { "product-id": qty, ... }
   WHATSAPP NUMBER — change here if it ever changes
   ============================================================ */
const WHATSAPP_NUMBER = "919810704170"; // country code 91 + number

function readCart() {
  try { return JSON.parse(localStorage.getItem("cs_cart")) || {}; }
  catch (e) { return {}; }
}
function writeCart(cart) {
  localStorage.setItem("cs_cart", JSON.stringify(cart));
  updateCartCount();
}
function addToCart(id, qty = 1) {
  const cart = readCart();
  cart[id] = (cart[id] || 0) + qty;
  writeCart(cart);
  renderCartDrawer();
  openCart();
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
    document.getElementById("cartTotal").textContent = "₹" + cartTotal();
  }
}

function buildWhatsAppMessage() {
  const cart = readCart();
  const lines = ["Hi ChillPrints! I'd like to order:", ""];
  Object.entries(cart).forEach(([id, qty]) => {
    const p = getProduct(id);
    if (p) lines.push(`• ${p.name} x${qty} — ₹${p.price * qty}`);
  });
  lines.push("", `Total: ₹${cartTotal()}`, "", "Please confirm availability & delivery.");
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
    `Hi ChillPrints! I'd like to order:\n\n• ${p.name} x1 — ₹${p.price}\n\nTotal: ₹${p.price}\n\nPlease confirm availability & delivery.`
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
});
