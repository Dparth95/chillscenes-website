# Product Catalog Backend — Setup (one-time, ~5 minutes)

Product & category data lives in a Google Sheet; a small Apps Script serves it
to the website and lets `admin.html` write to it. No tokens, no passwords.

## 1. Create the Sheet + Script
1. Go to [sheets.google.com](https://sheets.google.com) → create a new blank sheet.
   Name it e.g. "ChillScenes3D Products".
2. Extensions → Apps Script. Delete the default code, paste in all of `Code.gs`
   (in this folder). Save (Ctrl/Cmd+S).

## 2. Deploy as a Web App
1. Top-right **Deploy** → **New deployment**.
2. Type: **Web app**.
3. Execute as: **Me**. Who has access: **Anyone**.
4. Deploy. Authorize when prompted (it's your own script, safe to allow).
5. Copy the **Web app URL** — looks like
   `https://script.google.com/macros/s/AKfycb.../exec`.

## 3. Wire it into the site (one file, one time)
Open `js/config.js` and paste that URL in:
```js
const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
```
Commit/push this one file. That's the entire setup — `admin.html` now works
immediately on any device. No login, no other configuration.

## 4. Using admin.html
Open it (phone or PC) — it's ready right away. Tap a photo (auto-loaded from
`images/products/` in this repo), fill in the product details, submit.
Use **New Category** for a new category.

## If you ever change the code
Repeat step 2 (**Deploy → Manage deployments → edit (pencil) → New version →
Deploy**) — editing `Code.gs` alone doesn't update the live Web App.

## Note on openness
This setup has no password on writes — anyone who has your Apps Script URL
could technically add rows to your Sheet. The URL isn't linked anywhere public,
so this is low-risk for a small storefront. If that ever matters more later,
a simple shared-secret check can be added back into `Code.gs`.
