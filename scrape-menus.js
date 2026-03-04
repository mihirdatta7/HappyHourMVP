#!/usr/bin/env node
/**
 * Happy Hour NYC — Daily Menu Scraper
 * Runs via GitHub Actions once/twice a day.
 * Fetches each venue's website, uses Claude AI to extract
 * happy hour menu data, and writes menus.json.
 */

const fs = require('fs');
const https = require('https');
const http = require('http');

// ─── Venue list with their websites ────────────────────────────────────────
// Add/remove venues here. id must match the key used in the main app's HH_DATA.
const VENUES = [
  { id: "dollys",           name: "Dolly's",                url: "https://www.dollys51.com" },
  { id: "sir-henrys",       name: "Sir Henry's",             url: "https://www.sirhenrysnyc.com" },
  { id: "the-dickens",      name: "The Dickens",             url: "https://www.thedickensnyc.com" },
  { id: "haswell-greens",   name: "Haswell Green's",         url: "https://www.haswellgreens.com" },
  { id: "marseille",        name: "Marseille",               url: "https://www.marseillenyc.com" },
  { id: "russian-vodka-room", name: "Russian Vodka Room",   url: "https://russianvodkaroomnyc.com" },
  { id: "ardesia",          name: "Ardesia",                 url: "https://www.ardesia-ny.com" },
  { id: "mercury-bar",      name: "Mercury Bar",             url: "https://www.mercurybarnyc.com" },
  { id: "waylon",           name: "Waylon",                  url: "https://www.waylonnyc.com" },
  { id: "rudys",            name: "Rudy's Bar & Grill",      url: "https://rudysbarnyc.com" },
  { id: "golden-hof",       name: "Golden Hof",              url: "https://www.goldenhofnyc.com" },
  { id: "rum-house",        name: "The Rum House",           url: "https://www.therumhousenyc.com" },
  { id: "valerie",          name: "Valerie",                 url: "https://www.valerienyc.com" },
  { id: "havana-central",   name: "Havana Central",          url: "https://www.havanacentral.com" },
  { id: "old-town-bar",     name: "Old Town Bar",            url: "https://oldtownbarnyc.com" },
  { id: "la-nacional",      name: "La Nacional",             url: "https://www.lanacionaltapasbar.com" },
  { id: "magic-hour",       name: "Magic Hour Rooftop",      url: "https://www.magichourrooftop.com" },
  { id: "half-king",        name: "The Half King",           url: "https://www.thehalfking.com" },
  { id: "porchlight",       name: "Porchlight",              url: "https://www.porchlightbar.com" },
  { id: "dante-wv",         name: "Dante West Village",      url: "https://www.dante-nyc.com/west-village" },
  { id: "dante-gv",         name: "Dante",                   url: "https://www.dante-nyc.com" },
  { id: "stonewall-inn",    name: "Stonewall Inn",           url: "https://www.thestonewallinnnyc.com" },
  { id: "amelie-gv",        name: "Amélie Wine Bar",         url: "https://www.amelienyc.com" },
  { id: "miss-lilys",       name: "Miss Lily's",             url: "https://www.misslilysnyc.com" },
  { id: "the-wayland",      name: "The Wayland",             url: "https://www.thewaylandnyc.com" },
  { id: "mermaid-inn",      name: "The Mermaid Inn",         url: "https://www.themermaidnyc.com" },
  { id: "verlaine",         name: "Verlaine",                url: "https://www.verlainenyc.com" },
  { id: "cervos",           name: "Cervo's",                 url: "https://www.cervosnyc.com" },
  { id: "mr-purple",        name: "Mr. Purple",              url: "https://www.mrpurplenyc.com" },
  { id: "spring-lounge",    name: "Spring Lounge",           url: "https://springlounge.com" },
  { id: "roxy-bar",         name: "Roxy Bar",                url: "https://www.roxyhotelnyc.com/food-drink/roxy-bar" },
  { id: "the-odeon",        name: "The Odeon",               url: "https://www.theodeonrestaurant.com" },
  { id: "dead-rabbit",      name: "The Dead Rabbit",         url: "https://thedeadrabbit.com" },
  { id: "pier-a",           name: "Pier A Harbor House",     url: "https://www.piera.com" },
  { id: "fraunces-tavern",  name: "Fraunces Tavern",         url: "https://frauncestavernrestaurant.com" },
  { id: "tao-downtown",     name: "TAO Downtown",            url: "https://www.taorestaurant.com" },
  { id: "mollys-shebeen",   name: "Molly's Shebeen",        url: "https://www.mollysdivebarnyc.com" },
  { id: "penrose",          name: "Penrose",                 url: "https://www.penrosebar.com" },
  { id: "amelie-uws",       name: "Amélie Wine Bar UWS",     url: "https://www.amelienyc.com" },
  { id: "jakes-dilemma",    name: "Jake's Dilemma",          url: "https://www.jakesdilemma.com" },
  { id: "red-rooster",      name: "Red Rooster Harlem",      url: "https://www.redroosterharlem.com" },
  { id: "vinateria",        name: "Vinateria",               url: "https://www.vinateriaharlem.com" },
  { id: "harlem-tavern",    name: "Harlem Tavern",           url: "https://www.harlemtavern.com" },
  { id: "the-heights",      name: "The Heights",             url: "https://www.theheightsbarnyc.com" },
  { id: "employees-only",   name: "Employees Only",          url: "https://www.employeesonlynyc.com" },
  { id: "katana-kitten",    name: "Katana Kitten",           url: "https://www.katanakittennyc.com" },
  { id: "attaboy",          name: "Attaboy",                 url: "https://attaboy.us" },
  { id: "death-and-co",     name: "Death & Co",              url: "https://www.deathandcompany.com" },
  { id: "superbueno",       name: "Superbueno",              url: "https://www.superbuenobar.com" },
  { id: "bar-goto",         name: "Bar Goto",                url: "https://www.bargoto.com" },
  { id: "amor-y-amargo",    name: "Amor y Amargo",           url: "https://www.amoryamargo.com" },
  { id: "maison-premiere",  name: "Maison Premiere",         url: "https://www.maisonpremiere.com" },
  { id: "pearl-oyster-bar", name: "Pearl Oyster Bar",        url: "https://www.pearloysterbar.com" },
  { id: "jungle-bird",      name: "Jungle Bird",             url: "https://www.junglebirdnyc.com" },
  { id: "la-caverna",       name: "La Caverna",              url: "https://www.lacavernanyc.com" },
  { id: "bar-moga",         name: "Bar Moga",                url: "https://www.barmoga.com" },
  { id: "buvette",          name: "Buvette",                 url: "https://ilovebuvette.com" },
  { id: "le-dive",          name: "Le Dive",                 url: "https://www.ledivenyc.com" },
  { id: "gramercy-tavern-bar", name: "Gramercy Tavern Bar",  url: "https://www.gramercytavern.com" },
  { id: "refinery-rooftop", name: "Refinery Rooftop",        url: "https://www.refineryrooftopnyc.com" },
  { id: "nomad-bar",        name: "NoMad Bar",               url: "https://www.thenomadhotel.com/bar" },
  { id: "rosevale",         name: "Rosevale",                url: "https://www.rosevalenyc.com" },
  { id: "el-camino",        name: "El Camino",               url: "https://www.elcaminonyc.com" },
  { id: "slowly-shirley",   name: "Slowly Shirley",          url: "https://www.slowlyshirley.com" },
  { id: "viv-thai",         name: "Viv Thai",                url: "https://www.vivthaikitchen.com" },
  { id: "raines-law-room",  name: "Raines Law Room",         url: "https://www.raineslawroom.com" },
  { id: "dear-irving",      name: "Dear Irving",             url: "https://www.dearirving.com" },
  { id: "golden-ratio",     name: "Golden Ratio",            url: "https://www.goldenrationyc.com" },
  { id: "sake-bar-decibel", name: "Sake Bar Decibel",        url: "https://www.sakebardecibel.com" },
  { id: "sakagura",         name: "Sakagura",                url: "https://www.sakagura.com" },
  { id: "bar-belly",        name: "Bar Belly",               url: "https://www.barbelly.com" },
  { id: "the-jeffrey",      name: "The Jeffrey",             url: "https://www.thejeffreynyc.com" },
  { id: "fish-cheeks",      name: "Fish Cheeks",             url: "https://www.fishcheeksnyc.com" },
  { id: "fleur-room",       name: "Fleur Room",              url: "https://www.fleurroom.com" },
  { id: "the-ten-bells",    name: "The Ten Bells",           url: "https://www.thetenbells.com" },
  { id: "vin-sur-vingt",    name: "Vin Sur Vingt",           url: "https://www.vsvnyc.com" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function fetchPage(url, timeoutMs = 12000) {
  return new Promise((resolve) => {
    const lib = url.startsWith('https') ? https : http;
    let data = '';
    const req = lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HappyHourNYC-MenuBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      }
    }, (res) => {
      // Follow one redirect
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        fetchPage(res.headers.location, timeoutMs).then(resolve);
        return;
      }
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ ok: true, body: data }));
    });
    req.on('error', (e) => resolve({ ok: false, error: e.message }));
    req.setTimeout(timeoutMs, () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
  });
}

function stripHtml(html) {
  // Remove scripts, styles, nav, footer — keep meaningful text
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{3,}/g, '\n')
    .trim()
    .slice(0, 6000); // Keep first 6k chars — enough for menu info
}

async function askClaude(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const body = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are a menu data extractor for a NYC happy hour app. 
Extract structured menu data from restaurant website text.
You MUST respond with ONLY valid JSON — no markdown, no explanation, no backticks.
The JSON must be an array of menu tab objects with this exact shape:
[
  {
    "label": "Happy Hour",
    "cats": [
      {
        "cat": "Cocktails",
        "items": [
          { "name": "Margarita", "price": "$9", "desc": "tequila, lime, triple sec" }
        ]
      }
    ]
  }
]
Rules:
- Always include a "Happy Hour" tab if HH deals are mentioned
- Include a "Cocktails" tab for signature drinks
- Include a "Food" tab if food menu is present
- If no happy hour info found, return an empty array []
- Prices must be strings like "$9" or "$8-12"
- Keep item names concise, descriptions brief (under 10 words)
- Max 8 items per category, max 3 categories per tab`,
    messages: [{ role: 'user', content: prompt }]
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text || '[]';
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🍺 Happy Hour NYC Menu Scraper — ${new Date().toISOString()}`);
  console.log(`📋 Processing ${VENUES.length} venues...\n`);

  // Load existing menus.json so we can keep data for venues that fail to scrape
  let existing = {};
  if (fs.existsSync('menus.json')) {
    try { existing = JSON.parse(fs.readFileSync('menus.json', 'utf8')).menus || {}; }
    catch (e) { console.warn('Could not parse existing menus.json, starting fresh'); }
  }

  const results = { ...existing };
  let scraped = 0, failed = 0, skipped = 0;

  for (const venue of VENUES) {
    console.log(`→ [${venue.id}] ${venue.name}`);

    try {
      // Fetch the page
      const res = await fetchPage(venue.url);
      if (!res.ok) {
        console.log(`  ⚠️  Fetch failed: ${res.error} — keeping existing data`);
        failed++;
        continue;
      }

      const text = stripHtml(res.body);
      if (text.length < 100) {
        console.log(`  ⚠️  Page too short (JS-rendered?) — keeping existing data`);
        skipped++;
        continue;
      }

      // Ask Claude to extract menu
      const prompt = `Extract the menu and happy hour info for "${venue.name}" (NYC bar/restaurant) from this website text:\n\n${text}`;
      const claudeResponse = await askClaude(prompt);

      // Parse and validate
      const menuData = JSON.parse(claudeResponse);
      if (!Array.isArray(menuData)) throw new Error('Response is not an array');

      results[venue.id] = menuData;
      console.log(`  ✅ Extracted ${menuData.length} tabs, ${menuData.reduce((a,t)=>a+t.cats.reduce((b,c)=>b+c.items.length,0),0)} items`);
      scraped++;

    } catch (e) {
      console.log(`  ❌ Error: ${e.message} — keeping existing data`);
      failed++;
    }

    // Throttle: 1 venue per 2 seconds to be respectful + avoid Claude rate limits
    await sleep(2000);
  }

  // Write output
  const output = {
    updatedAt: new Date().toISOString(),
    venueCount: Object.keys(results).length,
    menus: results
  };

  fs.writeFileSync('menus.json', JSON.stringify(output, null, 2));

  console.log(`\n✅ Done!`);
  console.log(`   Scraped: ${scraped} | Failed: ${failed} | Skipped (JS-rendered): ${skipped}`);
  console.log(`   menus.json updated with ${Object.keys(results).length} venues`);
  console.log(`   Updated at: ${output.updatedAt}`);
}

main().catch(e => { console.error(e); process.exit(1); });
