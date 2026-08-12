# NOD SEO Optimization Plan

## Date: 2026-03-03

## Status: Phase 1-4 Complete / Phase 5 Pending (Manual)

---

## Completed (Code Changes)

### Phase 1: Urgent Fixes
- [x] Removed fake `aggregateRating` from JSON-LD (spam policy risk)
- [x] Added `sameAs` external profiles (GitHub, Chrome Web Store)

### Phase 2: Structured Data Enhancement
- [x] Added `WebSite` JSON-LD with site name and language support
- [x] Created reusable `BreadcrumbJsonLd` component, applied to home + blog index
- [x] Added `generateMetadata` to blog index page (8 languages)

### Phase 3: Crawling/Indexing Optimization
- [x] Fixed sitemap `lastModified` from `new Date()` to actual dates
- [x] Verified canonical URL normalization (no issues found)

### Phase 4: Page Quality
- [x] Created dynamic OG images for all 6 blog posts
- [x] Added metadata to pricing page (8 languages, full SEO)
- [x] Added noindex to legal pages (privacy, terms, refund)
- [x] Added metadata to help page

---

## Phase 5: External Signals (Manual Actions Required)

### 5-1. Google Search Console

**Priority: CRITICAL**

1. **Sitemap submission**
   - Go to GSC > Sitemaps > Submit `https://nod.ing/sitemap.xml`
   - Verify all URLs are discovered and indexed

2. **URL Inspection**
   - Inspect `https://nod.ing/` — request indexing if not indexed
   - Inspect `https://nod.ing/blog` — request indexing
   - Inspect each blog post URL — request indexing
   - Inspect `https://nod.ing/pricing` — request indexing

3. **Coverage report**
   - Check for any excluded or errored pages
   - Fix any "Discovered - currently not indexed" issues

4. **Core Web Vitals**
   - Monitor CWV report after deployment
   - Target: LCP < 2.5s, FID < 100ms, CLS < 0.1

### 5-2. Google Business Profile

- Consider creating a Google Business Profile for "NOD" if applicable
- Links back to nod.ing for additional authority signal

### 5-3. External Profile Creation

**Priority: HIGH**

Create profiles on these platforms (each provides a backlink):

| Platform | URL | Action |
|----------|-----|--------|
| GitHub | https://github.com/jidohyun/NOD | Already exists - ensure README has link to nod.ing |
| Chrome Web Store | Already listed | Optimize description with keywords |
| Product Hunt | producthunt.com | Create a launch page for NOD |
| AlternativeTo | alternativeto.net | List NOD as alternative to Notion, Evernote, Pocket |
| Twitter/X | x.com | Create @NOD account, link to nod.ing |
| LinkedIn | linkedin.com | Create company page |
| Dev.to | dev.to | Cross-post blog articles |
| Hacker News | news.ycombinator.com | Share launch post |

### 5-4. Backlink Strategy

**Priority: HIGH**

1. **GitHub README**
   - Add badges, demo link, and description with target keywords
   - Link to nod.ing prominently

2. **Chrome Web Store listing**
   - Optimize title: "NOD - AI Article Summarizer & Knowledge Manager"
   - Include keywords: article summarizer, web clipper, semantic search, second brain
   - Add screenshots and detailed description

3. **Blog cross-posting**
   - Publish articles on Dev.to, Medium, Hashnode
   - Include canonical URL pointing back to nod.ing/blog/[slug]
   - This preserves SEO value while gaining exposure

4. **Directory submissions**
   - Submit to SaaS directories: SaaSHub, G2, Capterra
   - Submit to Chrome extension directories: extensionwatch.com

### 5-5. Content Strategy (Ongoing)

**Priority: MEDIUM**

1. **Target keywords to create content for:**
   - "AI article summarizer" (already covered)
   - "best web clipper chrome" (already covered)
   - "knowledge management tool"
   - "second brain app"
   - "save articles chrome extension"
   - "AI note taking"
   - "semantic search tool"

2. **Content calendar:**
   - 2-4 new blog posts per month
   - Focus on long-tail keywords with low competition
   - Each post should be 1500+ words with FAQ section

3. **Internal linking:**
   - Every new blog post should link to 2-3 existing posts
   - Landing page should naturally link to relevant blog posts

---

## Verification Checklist (Post-Deployment)

- [ ] Run Google Rich Results Test on https://nod.ing/
- [ ] Run Google Mobile-Friendly Test
- [ ] Verify sitemap.xml loads correctly
- [ ] Verify robots.txt loads correctly
- [ ] Test OG images with https://www.opengraph.xyz/
- [ ] Submit sitemap in Google Search Console
- [ ] Request indexing for key pages in GSC
- [ ] Monitor GSC Coverage report for 2 weeks
- [ ] Check Google search for "nod.ing" after 1-2 weeks

---

## Files Changed

| File | Change |
|------|--------|
| `components/seo/json-ld.tsx` | Removed aggregateRating, added sameAs, WebSiteJsonLd, BreadcrumbJsonLd |
| `components/seo/blog-og-image.tsx` | New: shared blog OG image generator |
| `app/[locale]/page.tsx` | Added WebSiteJsonLd, BreadcrumbJsonLd |
| `app/[locale]/blog/page.tsx` | Added generateMetadata, BreadcrumbJsonLd |
| `app/[locale]/blog/*/opengraph-image.tsx` | New: 6 dynamic OG images |
| `app/[locale]/pricing/page.tsx` | Added generateMetadata (8 languages) |
| `app/[locale]/privacy/page.tsx` | Added noindex metadata |
| `app/[locale]/terms/page.tsx` | Added noindex metadata |
| `app/[locale]/refund/page.tsx` | Added noindex metadata |
| `app/[locale]/help/page.tsx` | Added metadata |
| `app/sitemap.ts` | Fixed lastModified dates |
