# Happy Hour NYC 🍺

NYC's best happy hours — 132 venues, live Google ratings, daily menu updates.

**Live site:** https://happyhour-nyc.netlify.app

## How it works

- `index.html` — the entire frontend (single-file app)
- `menus.json` — menu data for all venues, auto-updated daily
- `scrape-menus.js` — scraper that fetches venue websites + uses Claude AI to extract menus
- `.github/workflows/scrape-menus.yml` — GitHub Actions cron job (runs 10AM + 6PM EST)

## Daily Auto-Update Flow

```
GitHub Actions (cron 10AM + 6PM EST)
  → scrape-menus.js fetches each venue's website
  → Claude AI parses menu text into structured JSON
  → menus.json committed to repo
  → Netlify detects push → auto-deploys
  → App loads fresh menus.json on next page visit
```

## Setup

### 1. Connect Netlify to this GitHub repo
- In Netlify: **Add new site → Import an existing project → GitHub**
- Select this repo
- Build command: *(leave empty)*
- Publish directory: `.` (root)
- Deploy!

### 2. Add GitHub Secret
- Go to **Settings → Secrets and variables → Actions → New repository secret**
- Name: `ANTHROPIC_API_KEY`
- Value: your Anthropic API key

### 3. Done
GitHub Actions will now run the scraper automatically twice a day.
You can also trigger it manually from the **Actions** tab → **Scrape Happy Hour Menus** → **Run workflow**.

## Adding/updating venues

To add a venue to the scraper, edit the `VENUES` array in `scrape-menus.js`.
The `id` must match the key used in `HH_DATA` inside `index.html`.
