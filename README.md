# ChillPrints — Site

Static site, no build step. Cart uses `localStorage`; checkout opens WhatsApp
(+91 98107 04170) with the order pre-filled.

## Add your product photos
1. Put image files in `images/products/` (jpg/png, square photos look best, ~800×800px).
2. Open `js/products.js`, find the product, change `image: "images/products/placeholder.jpg"`
   to your file, e.g. `image: "images/products/magnet-city-skyline.jpg"`.

## Add a new product
In `js/products.js`, copy a line inside `PRODUCTS` and edit:
```js
{ id: "unique-slug", name: "Product Name", price: 199, category: "fridge-magnets",
  image: "images/products/your-photo.jpg", desc: "Short description.", featured: true }
```
`category` must match one of the slugs in `CATEGORIES` at the top of the same file.
`featured: true` shows it on the homepage.

## Add a new category
Add an entry to `CATEGORIES` in `js/products.js` with a unique `slug`, `name`, `icon` (emoji).

## Change the WhatsApp number
Edit `WHATSAPP_NUMBER` at the top of `js/cart.js` (format: countrycode+number, no `+` or spaces).

## Deploy to GitHub Pages
1. Push this folder's contents to a GitHub repo (root, or a `/docs` folder).
2. Repo → Settings → Pages → set source branch/folder.
3. Site goes live at `https://<username>.github.io/<repo>/`.
4. Later, when you buy a domain: Settings → Pages → add your custom domain,
   then point your domain's DNS (A records / CNAME) to GitHub Pages per their docs.

## Pages
- `index.html` — home, categories, featured products
- `shop.html` — full catalog with category filter tabs
- `product.html?id=<product-id>` — product detail page
