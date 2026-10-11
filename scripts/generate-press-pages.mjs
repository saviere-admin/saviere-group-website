#!/usr/bin/env node
/**
 * Generate crawlable, pre-rendered pages for published entries in press-data.json.
 * Run from the repository root: node scripts/generate-press-pages.mjs
 * This script does not rewrite press-data.json or any draft/unpublished entry.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://savieregroup.com';
const CORE_URLS = [
  '/', '/about.html', '/governance.html', '/active-operations.html',
  '/roadmap.html', '/press.html', '/sitemap.html'
];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}
function slugify(value = '') {
  const slug = String(value).normalize('NFKD').toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 76).replace(/-+$/g, '');
  return slug || 'company-update';
}
function isoDate(value) {
  const timestamp = Date.parse(String(value || ''));
  return Number.isNaN(timestamp) ? null : new Date(timestamp).toISOString();
}
function firstSentence(value, max = 158) {
  const compact = String(value || '').replace(/\s+/g, ' ').trim();
  if (compact.length <= max) return compact;
  const clipped = compact.slice(0, max - 1);
  const boundary = clipped.lastIndexOf(' ');
  return (boundary > 90 ? clipped.slice(0, boundary) : clipped).trim() + '…';
}
function renderBody(text) {
  const blocks = String(text || '').replace(/\r/g, '').split(/\n\s*\n/).map(block => block.trim()).filter(Boolean);
  return blocks.map(block => {
    const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length && lines.every(line => /^[-•]\s+/.test(line))) {
      return '<ul>' + lines.map(line => '<li>' + escapeHtml(line.replace(/^[-•]\s+/, '')) + '</li>').join('') + '</ul>';
    }
    return '<p>' + lines.map(escapeHtml).join('<br>') + '</p>';
  }).join('\n');
}
async function resolveMedia(rawValue, slug) {
  const raw = String(rawValue || '').trim();
  const match = raw.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,([a-z0-9+/=\r\n]+)$/i);
  if (match) {
    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const relative = `/assets/press-media/${slug}.${ext}`;
    const target = path.join(ROOT, relative.replace(/^\//, ''));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, Buffer.from(match[2].replace(/\s/g, ''), 'base64'));
    return SITE + relative;
  }
  if (/^https:\/\//i.test(raw)) return raw;
  return null;
}
function articlePage(item, slug, canonical, imageUrl) {
  const title = String(item.title || 'Savière Group update').trim();
  const category = String(item.category || 'Corporate Update').trim();
  const description = firstSentence(item.content || title);
  const date = String(item.date || '').trim();
  const published = isoDate(date);
  const mediaMarkup = imageUrl ? `<figure class="feature-media"><img src="${escapeHtml(imageUrl)}" alt="Media accompanying: ${escapeHtml(title)}" loading="eager"><figcaption>Media associated with this entry.</figcaption></figure>` : '';
  const type = category.toLowerCase() === 'media coverage' ? 'WebPage' : 'Article';
  const schema = {
    '@context': 'https://schema.org', '@type': type, '@id': canonical + '#webpage',
    url: canonical, name: title, headline: title, description,
    isPartOf: { '@id': SITE + '/#website' }, about: { '@id': SITE + '/#organization' },
    inLanguage: 'en-IN'
  };
  if (type === 'Article') {
    schema.author = { '@type': 'Organization', name: 'Savière Group', url: SITE + '/' };
    schema.publisher = { '@type': 'Organization', name: 'Savière Group', url: SITE + '/' };
    if (published) schema.datePublished = published;
    if (imageUrl) schema.image = [imageUrl];
  }
  const schemaText = JSON.stringify(schema).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#520A1E">
<title>${escapeHtml(title)} | Savière Group Journal</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" href="/assets/favicon.ico"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Marcellus&family=Poppins:wght@300;400;500;600;700&family=Nunito+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/assets/css/site.css">
<meta property="og:type" content="article"><meta property="og:site_name" content="Savière Group"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(imageUrl || SITE + '/assets/android-chrome-512x512.png')}"><meta property="og:image:alt" content="${escapeHtml(title)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(imageUrl || SITE + '/assets/android-chrome-512x512.png')}">
<script type="application/ld+json">${schemaText}</script></head><body><a class="skip-link" href="#main">Skip to content</a>
<header class="site-header"><div class="shell header-inner"><a class="brand" href="/" aria-label="Savière Group home"><img src="/assets/TransBGRHorizontal.png" width="410" height="116" alt="Savière Group"></a><nav class="desktop-nav" aria-label="Primary navigation"><a class="nav-link" href="/">Group</a><a class="nav-link" href="/about.html">About</a><a class="nav-link" href="/governance.html">Governance</a><a class="nav-link" href="/active-operations.html">Operations</a><a class="nav-link" href="/roadmap.html">Roadmap</a><a class="nav-link" href="/press.html" aria-current="page">Journal &amp; Press</a></nav><a class="header-cta" href="mailto:connect@savieregroup.com">Media enquiry ↗</a><button class="menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="mobile-panel" aria-label="Open navigation menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div><div class="mobile-panel" data-mobile-panel hidden><nav class="shell" aria-label="Mobile navigation"><a href="/">Group ↗</a><a href="/about.html">About ↗</a><a href="/governance.html">Governance ↗</a><a href="/active-operations.html">Operations ↗</a><a href="/roadmap.html">Roadmap ↗</a><a href="/press.html" aria-current="page">Journal &amp; Press ↗</a></nav></div></header>
<main id="main" class="shell journal-detail"><p class="eyebrow" style="margin-top:3rem">${escapeHtml(category)}</p><article><header class="journal-detail-header"><h1 class="display">${escapeHtml(title)}</h1><p class="muted">${escapeHtml(date)} · Savière Group Journal</p></header>${mediaMarkup}<div class="journal-body">${renderBody(item.content)}</div><div class="contact-band" style="margin-top:3rem"><div><p class="eyebrow">Official company contact</p><h2 class="display">Continue the conversation.</h2><p>For questions about this entry, contact Savière Group.</p></div><a class="button" href="mailto:connect@savieregroup.com">Email Savière ↗</a></div><p style="margin:2rem 0 4rem"><a class="button button-secondary" href="/press.html">← Back to Journal &amp; Press</a></p></article></main>
<footer class="site-footer"><div class="shell"><div class="footer-main"><div class="footer-brand"><a href="/"><img src="/assets/TransBGRHorizontal.png" width="400" height="112" alt="Savière Group"></a><p>BUILDING THOUGHTFUL BUSINESSES FROM INDIA.<br>Think deeply. Build boldly.</p><p><a href="mailto:connect@savieregroup.com">connect@savieregroup.com</a></p></div><nav class="footer-links" aria-label="Footer navigation"><a href="/about.html">About</a><a href="/governance.html">Governance</a><a href="/active-operations.html">Operations</a><a href="/roadmap.html">Roadmap</a><a href="/press.html">Journal &amp; Press</a><a href="/sitemap.html">Site directory</a></nav></div><div class="footer-bottom"><span>© <span data-current-year>2026</span> Savière Group Private Limited</span><span>Hyderabad, Telangana, India</span><span>Evidence first. Quality before scale. Build for decades.</span></div></div></footer><script src="/assets/js/site.js" defer></script></body></html>`;
}

async function main() {
  const inputPath = path.join(ROOT, 'press-data.json');
  let data;
  try { data = JSON.parse(await readFile(inputPath, 'utf8')); }
  catch (error) { throw new Error(`Could not read valid press-data.json at ${inputPath}: ${error.message}`); }
  if (!Array.isArray(data)) throw new Error('press-data.json must contain a JSON array');
  const published = data.filter(item => String(item?.status || '').toLowerCase() === 'published');
  const seenSlugs = new Set();
  const routeIndex = [];
  const sitemapUrls = [...CORE_URLS];

  for (const item of published) {
    const base = slugify(item.title || `company-update-${item.id || ''}`);
    let slug = base;
    if (seenSlugs.has(slug)) slug = `${base}-${slugify(item.id || String(routeIndex.length + 1))}`;
    seenSlugs.add(slug);
    const outputDir = path.join(ROOT, 'press', slug);
    const canonical = `${SITE}/press/${slug}/`;
    const imageUrl = await resolveMedia(item.media, slug);
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'index.html'), articlePage(item, slug, canonical, imageUrl), 'utf8');
    routeIndex.push({ id: String(item.id ?? ''), slug, url: `/press/${slug}/`, category: String(item.category || 'Corporate Update'), title: String(item.title || '') });
    sitemapUrls.push(`/press/${slug}/`);
  }

  await writeFile(path.join(ROOT, 'press-generated-index.json'), JSON.stringify(routeIndex, null, 2) + '\n', 'utf8');
  const uniqueUrls = [...new Set(sitemapUrls)];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls.map(url => `  <url><loc>${SITE}${url === '/' ? '/' : url}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');
  console.log(`Generated ${routeIndex.length} published journal pages; wrote press-generated-index.json and sitemap.xml.`);
  console.log('Unpublished, draft and scheduled entries were left out.');
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
