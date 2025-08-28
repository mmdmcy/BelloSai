SEO & AI-Visibility Checklist for BelloSai

Goal: Make bellosai.com eligible for indexing and maximize chances of being recommended by AI systems and search engines.

Immediate technical steps (already applied in this repo):
- Set canonical URLs to https://bellosai.com in `index.html` (non-www).
- Added `public/robots.txt` allowing search engines and common AI crawlers.
- Added `public/llms.txt` with concise business info for AI systems.
- Updated `public/sitemap.xml` to use non-www URLs.
- Added Vercel redirect in `vercel.json` to permanently redirect www.bellosai.com -> bellosai.com.
- Updated Supabase `site_url` to non-www.

Google Search Console (GSC) - recommended next steps:
- Verify domain property: use DNS verification for `bellosai.com` (covers both www and non-www).
- Submit sitemap: https://bellosai.com/sitemap.xml in GSC.
- Inspect live URL for homepage and ensure it returns 200 and canonical is https://bellosai.com/.

Indexing and crawl checks:
- Ensure homepage responds quickly (< 3s). Use Lighthouse and PageSpeed Insights.
- Check robots.txt in the live site: https://bellosai.com/robots.txt and ensure it allows crawlers.
- Validate structured data: use Google Rich Results test with homepage URL.

Content & AI visibility:
- Create 1-3 long-form pages (1000+ words) covering how BelloSai works, pricing, and model comparisons.
- Add FAQ markup to key pages with conversational Q&A.
- Publish case studies and transcripts of demos (AI systems like quoted text).

Authority & Distribution:
- Claim Google Business Profile if relevant.
- List on GitHub, Product Hunt, and industry-specific directories.
- Request mentions in reputable blogs and news sites.

Monitoring:
- Add Analytics and monitor direct traffic and referral sources.
- Periodically ask modern AIs (ChatGPT, Perplexity) for "best AI chat assistants" and see whether bellosai.com appears.

Common indexing problems to avoid (and how we've addressed them):
- "Pagina met omleiding" (Page with redirect): We keep the canonical domain non-www and use a 301 from www to non-www to avoid homepage being a redirect.
- "Dubbele pagina zonder door de gebruiker geselecteerde canonieke versie" (Duplicate page without user-selected canonical): We set explicit canonical tags to https://bellosai.com/ on homepage and ensure sitemap and structured data use the same.

Next recommended work (content + outreach):
- Implement detailed Product/Features pages with FAQ schema.
- Add more structured data types: Organization with address/contacts, Product for bundles, Review schema for testimonials.
- Build link outreach: get featured in 3-5 authoritative publications over next 6 months.

If you want, I can:
- Generate FAQ content and schema for `/pricing` and `/models` pages.
- Add more structured data snippets into page templates in `src/`.
- Run an accessibility and Lighthouse audit locally and suggest improvements.

Status: technical changes applied. Ready to proceed with content and outreach tasks on your cue.
