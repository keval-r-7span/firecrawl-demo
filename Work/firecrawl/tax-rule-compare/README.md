# Tax Rule Change Comparator (POC)

React demo that scrapes **two rule pages** with [Firecrawl](https://firecrawl.dev) (no custom backend) and shows what the **latest** document adds, removes, or **overrides** compared to the baseline.

## Quick start

```bash
cd tax-rule-compare
cp .env.example .env.local   # add your Firecrawl API key
npm install
npm run dev
```

Open http://localhost:5173 → click **Scrape & compare** (demo URLs are pre-filled).

## Demo URLs

- **Baseline:** UK employer rates 2024–25  
- **Latest:** UK employer rates 2025–26  

Swap in your own income-tax 2025 vs 2026 URLs for the client demo.

## Security note

The API key is read in the browser (`VITE_FIRECRAWL_API_KEY`). Anyone can see it in DevTools. Fine for a local POC; for production use a small backend proxy or rotate keys often.

## Build

```bash
npm run build
npm run preview
```
