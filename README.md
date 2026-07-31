# ChillScenes3D — Site

Static site, no build step. Cart uses `localStorage`; checkout opens WhatsApp
(+91 98107 04170) with the order pre-filled.

## Site logo
Replace `images/logo.png` with your real logo (square works best, ~160×160px+, PNG with
transparent background). It shows next to the brand name in the header on every page.

## How products work now
Product & category data lives in a **Google Sheet**, not in a code file — see
`apps-script/README-apps-script.md` for the one-time setup (~5 min). Photos still live in
`images/products/` in this repo (upload them there however you like, e.g. drag-and-drop on
github.com — no token needed).

Once set up (one URL pasted into `js/config.js`, one time):
1. Drop photos into `images/products/` whenever.
2. Open `admin.html` (phone or PC) — it's ready immediately, no login. Tap the photo, fill in
   the product form, Add Product. Saved straight to the Sheet.
3. The live site reads from the Sheet automatically, with local caching so pages load instantly
   even while it refreshes in the background.

To add a new product category, use the **New Category** panel at the top of `admin.html`.

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
