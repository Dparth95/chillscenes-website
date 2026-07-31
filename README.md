# ChillScenes3D — Site

Static site, no build step. Cart uses `localStorage`; checkout opens WhatsApp
(+91 98107 04170) with the order pre-filled.

## Add your product photos
1. Put image files in `images/products/` (jpg/png, square photos look best, ~800×800px).
2. Open `js/products.js`, find the product, change `image: "images/products/placeholder.jpg"`
   to your file, e.g. `image: "images/products/magnet-city-skyline.jpg"`.

## Site logo
Replace `images/logo.png` with your real logo (square works best, ~160×160px+, PNG with
transparent background). It shows next to the brand name in the header on every page.

## Add photos + products (recommended workflow)
1. Add your photo files directly into `images/products/` (via git, however you normally push files).
2. Open `admin.html` in Chrome or Edge, click **Connect Site Folder**, select this site folder.
3. Use **New Category** at the top if you need a category that doesn't exist yet.
4. In **Add Product**, pick the photo from the dropdown (it lists everything in `images/products/`),
   fill in name/price/category/description, submit. It updates `products.js` for you — no manual editing.
   (You can also upload a brand-new photo right from the form instead of picking an existing one.)
5. `git add`, `commit`, `push`.

If double-clicking `admin.html` doesn't let you connect, run a local server:
`python3 -m http.server` in this folder, then open `http://localhost:8000/admin.html`.

## Add a new product — manually
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
