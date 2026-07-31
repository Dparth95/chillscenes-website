/* ============================================================
   CART — stored in localStorage under key "cs_cart"
   Shape: { "product-id": qty, ... }
   WHATSAPP NUMBER — change here if it ever changes
   ============================================================ */
const WHATSAPP_NUMBER = "919810704170"; // country code 91 + number
const FREE_DELIVERY_THRESHOLD = 2000;
const DEFAULT_DELIVERY = 79;

/* State-wise courier charges — EDIT THESE with your real rates */
const DELIVERY_RATES = {
  "Delhi": 79, "Haryana": 79, "Uttarakhand": 89,
  "Punjab": 89, "Uttar Pradesh": 89, "Rajasthan": 89,
  "Gujarat": 99, "Maharashtra": 99, "Madhya Pradesh": 99, "Chhattisgarh": 99,
  "Telangana": 99, "Andhra Pradesh": 109, "Karnataka": 99, "Tamil Nadu": 109, "Kerala": 119,
  "West Bengal": 109, "Odisha": 119, "Bihar": 109, "Jharkhand": 109,
  "Himachal Pradesh": 129, "Jammu and Kashmir": 149,
  "Assam": 159, "North East": 169
};

/* Approximate PIN prefix (first 2 digits) → state, for delivery estimate.
   Refine any entries below if you find a mismatch. */
const PINCODE_STATE = {
  "11":"Delhi","12":"Haryana","13":"Haryana","14":"Punjab","15":"Punjab","16":"Punjab",
  "17":"Himachal Pradesh","18":"Jammu and Kashmir","19":"Jammu and Kashmir",
  "20":"Uttar Pradesh","21":"Uttar Pradesh","22":"Uttar Pradesh","23":"Uttar Pradesh",
  "24":"Uttarakhand","25":"Uttar Pradesh","26":"Uttarakhand","27":"Uttar Pradesh","28":"Uttar Pradesh",
  "30":"Rajasthan","31":"Rajasthan","32":"Rajasthan","33":"Rajasthan","34":"Rajasthan",
  "36":"Gujarat","37":"Gujarat","38":"Gujarat","39":"Gujarat",
  "40":"Maharashtra","41":"Maharashtra","42":"Maharashtra","43":"Maharashtra","44":"Maharashtra",
  "45":"Madhya Pradesh","46":"Madhya Pradesh","47":"Madhya Pradesh","48":"Madhya Pradesh","49":"Chhattisgarh",
  "50":"Telangana","51":"Andhra Pradesh","52":"Andhra Pradesh","53":"Andhra Pradesh",
  "56":"Karnataka","57":"Karnataka","58":"Karnataka","59":"Karnataka",
  "60":"Tamil Nadu","61":"Tamil Nadu","62":"Tamil Nadu","63":"Tamil Nadu","64":"Tamil Nadu","66":"Tamil Nadu",
  "67":"Kerala","68":"Kerala","69":"Kerala",
  "70":"West Bengal","71":"West Bengal","72":"West Bengal","73":"West Bengal","74":"West Bengal",
  "75":"Odisha","76":"Odisha","77":"Odisha",
  "78":"Assam","79":"North East",
  "80":"Bihar","81":"Bihar","82":"Jharkhand","83":"Jharkhand","84":"Bihar","85":"Bihar"
};

function getStateFromPincode(pin) {
  if (!/^\d{6}$/.test(pin)) return null;
  return PINCODE_STATE[pin.slice(0, 2)] || null;
}
function getDeliveryCharge(pin, subtotal) {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0;
  const state = getStateFromPincode(pin);
  if (!state) return null;
  return DELIVERY_RATES[state] ?? DEFAULT_DELIVERY;
}

function readCart() {
  try { return JSON.parse(localStorage.getItem("cs_cart")) || {}; }
  catch (e) { return {}; }
}
function writeCart(cart) {
  localStorage.setItem("cs_cart", JSON.stringify(cart));
  updateCartCount();
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

    document.getElementById("cartSubtotal").textContent = "₹" + subtotal;
    const deliveryEl = document.getElementById("cartDelivery");
    const totalEl = document.getElementById("cartTotal");

    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      deliveryEl.textContent = "FREE";
      deliveryEl.classList.add("free");
      totalEl.textContent = "₹" + subtotal;
    } else {
      const charge = getDeliveryCharge(pin, subtotal);
      deliveryEl.classList.remove("free");
      if (charge === null) {
        deliveryEl.textContent = "Enter pincode";
        totalEl.textContent = "₹" + subtotal + " + delivery";
      } else {
        deliveryEl.textContent = "₹" + charge;
        totalEl.textContent = "₹" + (subtotal + charge);
      }
    }
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
    if (p) lines.push(`• ${p.name} x${qty} — ₹${p.price * qty}`);
  });
  lines.push("", `Subtotal: ₹${subtotal}`);

  if (subtotal >= FREE_DELIVERY_THRESHOLD) {
    lines.push("Delivery: FREE (order above ₹2000)");
    lines.push(`Total: ₹${subtotal}`);
  } else {
    const charge = getDeliveryCharge(pin, subtotal);
    if (charge !== null) {
      lines.push(`Delivery (Pincode ${pin}): ₹${charge}`);
      lines.push(`Total: ₹${subtotal + charge}`);
    } else {
      lines.push("Delivery: to be confirmed");
      if (pin) lines.push(`Pincode: ${pin}`);
    }
  }
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
  const note = p.price >= FREE_DELIVERY_THRESHOLD ? "Delivery: FREE" : "Delivery charges apply (free above ₹2000)";
  const msg = encodeURIComponent(
    `Hi ChillScenes3D! I'd like to order:\n\n• ${p.name} x1 — ₹${p.price}\n\n${note}\n\nPlease confirm availability & delivery.`
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
  document.getElementById("pincodeInput")?.addEventListener("input", e => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    e.target.value = val;
    localStorage.setItem("cs_pincode", val);
    renderCartDrawer();
  });
});
