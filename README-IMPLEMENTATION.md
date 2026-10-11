# Savière Group website refresh — implementation guide

This is a set of complete replacement pages and new shared assets for the current plain-HTML website. It preserves Savière's design language: crimson `#520A1E`, gold `#D4AF37`, white/black, Marcellus display type, Poppins UI type and Nunito Sans body copy.

## Files in this package

- `index.html` — replacement homepage with Organization and WebSite JSON-LD.
- `about.html` — company overview.
- `governance.html` — governance and accountability principles.
- `active-operations.html` — current business status, written conservatively.
- `roadmap.html` — directional roadmap, without claiming future milestones are completed.
- `press.html` — search and category filter, safe text rendering, article view, share and print. Links use static article pages after the generator is run.
- `sitemap.html` — human-readable site directory.
- `assets/css/site.css` — shared style system and responsive design.
- `assets/js/site.js` — accessible mobile navigation, current year and reduced-motion-aware reveals.
- `robots.txt` — search crawler access and sitemap declaration; preserves the existing AI-training crawler exclusions.
- `sitemap.xml` — clean canonical public URL list; removes the duplicate `/index.html` URL and fabricated/stale last-modified dates.
- `site.webmanifest` — corrected site name, app paths and brand colours.
- `llms.txt` — concise machine-readable site orientation document. This is an emerging convention, not a substitute for SEO or a guarantee of AI visibility.
- `people-template.html` — unlinked, `noindex` template for later approved staff/headshot profiles. Do not add it to navigation or sitemap until populated.
- `scripts/generate-press-pages.mjs` — generator for a crawlable HTML page for each published journal entry.
- `package.json` and `press-generated-index.json` — zero-dependency command configuration and route map for generated entries.

## Copy/paste / replace procedure

1. Keep a branch or backup of the current site before replacing any files.
2. Copy the new `assets/css/site.css` and `assets/js/site.js` into the existing `assets/css/` and `assets/js/` directories. These are new shared assets and do not overwrite your existing image assets.
3. Replace the matching root HTML files with the files in this package.
4. Replace the root `robots.txt`, `sitemap.xml` and `site.webmanifest`; add `llms.txt` to the root.
5. Keep your existing `assets/` image files, `press-data.json` and `src/index.js`. The new press page reads `/press-data.json`; it does not replace the source data or the waitlist API.
6. Run `npm run generate:press` from the repository root after copying `press-data.json`; this generates a separate canonical HTML page for every published entry, creates `press-generated-index.json`, exports base64 media into `assets/press-media/`, and updates `sitemap.xml`. Commit the generated `press/` files and output JSON so they are deployed. If new entries are added later, run this command again before deployment.
7. Do not upload `people-template.html` as a linked public page yet. It is included only for when you have confirmed names, roles, approved biographies and portraits.
8. Preview on desktop and mobile. Confirm every linked path, logo image and social profile is correct.

## SEO, structured data and entity visibility

- The homepage includes `Organization` and `WebSite` JSON-LD, canonical URL, social metadata and sameAs URLs for the public profiles already supplied for Savière.
- Other pages have self-referencing canonical URLs, unique page titles/descriptions, social metadata and page-appropriate structured data.
- JSON-LD should always agree with visible page copy. Do not add employee counts, revenue, awards, telephone numbers, full registered-office address, tax identifiers, product-benefit claims or operating locations until independently verified and intentionally approved for publication.
- Never invent a Wikidata Q identifier or add a guessed Wikidata URL to `sameAs`. Wikidata is governed by community notability rules. A website and social profiles alone may not establish notability. Gather reliable, independent published sources before proposing an item, and keep the entity's description neutral.
- `llms.txt` is offered as a lightweight orientation file, not a ranking factor or promise that AI tools will use it.
- `robots.txt` keeps the prior stated `ai-train=no` preference and blocks several AI-training crawlers, while allowing ordinary search indexing. This means it is not configured for maximum access by AI training crawlers. Change that policy only as a deliberate company decision.
- Search visibility is not guaranteed by metadata. After deployment, verify the domain and sitemap in Google Search Console and Bing Webmaster Tools, inspect representative URLs, and run the JSON-LD through Google's Rich Results Test and Schema.org Validator.

## Press article SEO: run the generator

Before `npm run generate:press` is run, the press registry falls back to query-string article views. After the generator runs and its output is deployed, every published entry gets a pre-rendered canonical URL with its own title, description, Open Graph metadata, article/page structured data and sitemap entry. The route index lets the registry link directly to these static pages. Re-run the generator after publishing or unpublishing entries, and commit the output `press/` pages, `press-generated-index.json`, generated media assets and updated `sitemap.xml`.

## Accuracy and security cautions

- The Operations page labels DOTS as in development and does not repeat unsubstantiated product performance claims.
- The Roadmap explicitly describes phases as directional, not achievements or commitments.
- `robots.txt` and `noindex` are not access control. Any page or tool that must be private needs actual authentication or removal from the public deployment.
- The existing `editorial-manager.html` should be reviewed separately before treating it as a secure back-office tool. Never place API keys, passwords, tokens or private operational data in client-side code.
- Before production, review the registered office address against authoritative company records. This package intentionally uses only Hyderabad, Telangana, India to avoid publishing an unverified full street address.
