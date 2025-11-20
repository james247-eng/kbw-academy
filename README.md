KBW Academy — Project overview and quick start

This repository contains the Tech Wizards / KBW Academy static frontend, plus Netlify serverless functions used for payments and webhook handling.

What I changed (PWA & SEO updates)

- Updated the web manifest to include a proper name, short_name, start_url and correct icon paths (`favicon/site.webmanifest`). The manifest now points to the existing icons in the `favicon/` folder.
- Added a lightweight, offline-capable service worker at `service-worker.js` that precaches core pages and assets for basic offline support.
- Added a small client helper `js/pwa.js` that registers the service worker and exposes a helper `triggerPWAInstall()` to trigger the install prompt.
- Fixed icon and manifest links in `index.html` so the browser can locate the icons under `/favicon/`.
- Added `sitemap.xml` and `robots.txt` to help search engines index the site.

Files added/edited in this pass

- Added: `service-worker.js` — simple cache-first/navigation fallback service worker.
- Added: `js/pwa.js` — service worker registration + install prompt helper.
- Edited: `favicon/site.webmanifest` — fill in name/short_name and correct icon paths.
- Edited: `index.html` — fixed favicon/manifest URLs and included `js/pwa.js`.
- Added: `sitemap.xml`, `robots.txt`.

Why these changes

- PWA: The service worker + manifest make the site installable and provide offline access for core assets without adding any build tools (per your request).
- Icons: The existing icon files are in `favicon/`; the HTML and manifest needed to point to those files so browsers can find them.
- SEO: `sitemap.xml` + `robots.txt` are standard crawl signals for search engines and help indexation.

How the PWA works (short)

- The manifest (`/favicon/site.webmanifest`) tells browsers the app name and icons to use when installed. I left the actual icon images untouched — they are used as the app icon as you requested.
- The service worker caches core assets at install time and serves cached pages when offline. Navigation requests fallback to `/index.html` so users can still open the main UI while offline.
- `js/pwa.js` registers the service worker and captures the `beforeinstallprompt` event if you later want a custom install button.

Files & features mapping (high level)

- HTML pages: `index.html`, `about-us.html`, `all-courses.html`, `blog.html`, etc — main UI pages. `index.html` now includes the PWA registration script; you can add the same script tag to other pages if you'd like them to register the SW on first visit.
- CSS: `css/` contains page styles (`home.css`, `chatBot.css`, etc).
- JS: `js/` contains client scripts (`auth.js`, `checkout.js`, `courses.js`, `script.js`, etc). I added `js/pwa.js`.
- Favicon & icons: `favicon/` contains all icons and `site.webmanifest`.
- Serverless: `netlify/functions/` contains payment-related functions (Paystack integration). Keep environment secrets in Netlify.

What I recommend next (optional, but high value)

1. Add the same manifest & `js/pwa.js` include to other top-level HTML pages (`all-courses.html`, `about-us.html`, `students/*.html`) so the service worker registers for users visiting those pages directly.
2. Add `loading="lazy"` to large <img> tags (e.g., hero images and testimonial images) to improve performance.
3. Add descriptive alt text to any images missing it and check color contrast for accessibility.
4. If you want minified CSS/JS without adding build tooling, create `.min` versions manually or use an online minifier and check them into the repo.

How I validated

- Confirmed `favicon/` contains icon files and updated paths in the manifest and `index.html` to reference `/favicon/...`.
- Added a lightweight service worker script that uses only standard browser APIs — no build tools required.

How to test locally (quick)

1. From your repo root open a local static server (for example using VS Code Live Server) and visit `http://localhost:5500/` (or the port Live Server uses).
2. Open DevTools > Application > Manifest to verify the manifest loads and icons appear.
3. In DevTools > Application > Service Workers you should see `service-worker.js` registered after loading the page.
4. Try going offline (DevTools > Network > Offline) and refresh the page — the cached assets should still load.

If you want me to proceed further

- I can now propagate the manifest and PWA registration to other pages, add lazy-loading and accessibility improvements, and run a Lighthouse report. Confirm and I will make those edits next.

Notes & security

- I did not change any serverless functions or environment configuration. Do not commit secrets (Paystack keys, Firebase service account) into the repo.

If you'd like any of the optional next steps applied automatically, tell me which ones and I'll proceed.
