/* ============================================================
   PRODUCT CATALOG
   Add / edit / remove products here. Each product needs:
   - id: unique slug, no spaces (used in URLs and cart)
   - name, price (number, INR), category (must match a slug in CATEGORIES below)
   - image: path to file in images/products/
   - desc: short description shown on product page
   - featured: true to show on homepage
   ============================================================ */

const CATEGORIES = [
  { slug: "fridge-magnets",       name: "Fridge Magnets",         icon: "🧲" },
  { slug: "bathroom-organisers",  name: "Bathroom Organisers",    icon: "🧴" },
  { slug: "office-organisers",    name: "Office Table Organisers",icon: "🗂️" },
  { slug: "board-games",          name: "Board Games",            icon: "♟️" },
  { slug: "keyrings",             name: "Key Rings",              icon: "🔑" },
  { slug: "anime",                name: "Anime Products",         icon: "🎌" },
];

const PRODUCTS = [
  // ---------- Fridge Magnets ----------
  { id: "magnet-city-skyline", name: "City Skyline Magnet", price: 149, category: "fridge-magnets",
    image: "images/products/placeholder.jpg", desc: "Layered 3D-printed skyline fridge magnet, hand-painted finish.", featured: true },
  { id: "magnet-mini-planet", name: "Mini Planet Magnet Set (3pc)", price: 249, category: "fridge-magnets",
    image: "images/products/placeholder.jpg", desc: "Set of 3 miniature planet magnets, vivid multi-colour PLA.", featured: true },
  { id: "magnet-cat-face", name: "Cat Face Magnet", price: 99, category: "fridge-magnets",
    image: "images/products/placeholder.jpg", desc: "Cute cat-face magnet, strong neodymium backing.", featured: false },

  // ---------- Bathroom Organisers ----------
  { id: "bath-soap-case", name: "Drain-Style Soap Case", price: 199, category: "bathroom-organisers",
    image: "images/products/placeholder.jpg", desc: "Self-draining soap case, keeps soap dry between uses.", featured: true },
  { id: "bath-toothbrush-stand", name: "Toothbrush & Paste Stand", price: 249, category: "bathroom-organisers",
    image: "images/products/placeholder.jpg", desc: "4-slot toothbrush stand with paste holder base.", featured: true },
  { id: "bath-razor-holder", name: "Razor & Blade Holder", price: 179, category: "bathroom-organisers",
    image: "images/products/placeholder.jpg", desc: "Wall-mountable razor holder, water-resistant PETG.", featured: false },

  // ---------- Office Table Organisers ----------
  { id: "office-pen-stand", name: "Modular Pen Stand", price: 299, category: "office-organisers",
    image: "images/products/placeholder.jpg", desc: "Multi-compartment pen and stationery stand.", featured: true },
  { id: "office-cable-clip", name: "Cable Clip Set (5pc)", price: 149, category: "office-organisers",
    image: "images/products/placeholder.jpg", desc: "Keep desk cables tidy, adhesive-back clips.", featured: false },
  { id: "office-phone-stand", name: "Adjustable Phone Stand", price: 199, category: "office-organisers",
    image: "images/products/placeholder.jpg", desc: "Angle-adjustable desk phone stand, cable cutout.", featured: true },

  // ---------- Board Games ----------
  { id: "game-chess-set", name: "3D Printed Chess Set", price: 1499, category: "board-games",
    image: "images/products/placeholder.jpg", desc: "Full chess set, 2 colour pieces + fold-style board.", featured: true },
  { id: "game-sequence", name: "Sequence Game Set", price: 899, category: "board-games",
    image: "images/products/placeholder.jpg", desc: "Custom Sequence board with printed chips.", featured: false },
  { id: "game-ludo", name: "Premium Ludo Set", price: 699, category: "board-games",
    image: "images/products/placeholder.jpg", desc: "Thick-walled Ludo board with matching pawns & dice.", featured: false },

  // ---------- Key Rings ----------
  { id: "key-name-tag", name: "Custom Name Keychain", price: 99, category: "keyrings",
    image: "images/products/placeholder.jpg", desc: "Personalised name keychain, any name on order.", featured: true },
  { id: "key-car-logo", name: "Car Logo Keychain", price: 129, category: "keyrings",
    image: "images/products/placeholder.jpg", desc: "Detailed car-brand logo keychain, dual-colour print.", featured: false },

  // ---------- Anime Products ----------
  { id: "anime-figure-a", name: "Anime Character Figure", price: 599, category: "anime",
    image: "images/products/placeholder.jpg", desc: "Detailed hand-painted anime character figurine.", featured: true },
  { id: "anime-keychain-set", name: "Anime Keychain Set (3pc)", price: 249, category: "anime",
    image: "images/products/placeholder.jpg", desc: "Set of 3 popular anime-themed keychains.", featured: true },
  { id: "anime-stand", name: "Anime Phone Stand", price: 199, category: "anime",
    image: "images/products/placeholder.jpg", desc: "Character-themed desk phone stand.", featured: false },
];

function getProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}
function getCategory(slug) {
  return CATEGORIES.find(c => c.slug === slug);
}
