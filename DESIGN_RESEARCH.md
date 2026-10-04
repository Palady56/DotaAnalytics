# Design research

Research date: 1 October 2026. This document records what was actually on screen. It does not authorize an implementation pass. The running Passport UI stays as it is until a later phase adopts `DESIGN_DIRECTION.md` and `DESIGN_SYSTEM.md`.

Method: each public site was opened in a browser at desktop width. Where a consent dialog blocked the product, the chrome visible around it was recorded and the dialog was dismissed only when that was a cookie choice, not a login. Mobile width 390 was checked on OP.GG. Logged-in products that redirected to a login wall are marked as unseen.

## 1. Official Dota 2 — primary identity

Observed: `https://www.dota2.com/home` and `https://www.dota2.com/hero/antimage`.

### What was on screen

The home page is a full-bleed illustration under a thin top bar. The bar is not a colored brand strip. Wordmark, `GAME`, `HEROES`, `NEWS`, `ESPORTS` sit in small white type on the artwork. `PLAY FOR FREE` is an outlined rectangle: white 1px border, transparent fill, white type, corner radius 0. Loaded font families included Radiance, Reaver, Goudy Trajan, Noto Sans, and Averia Serif Libre. The page background computed to black.

The only chromatic UI mark in the chrome was a short horizontal red rule under section eyebrows (`DESTRUCTOID`, and again under `WHO WILL YOU CHOOSE?`). It is a few dozen pixels wide. It does not outline cards, buttons, or the navigation.

Hero identity is the artwork. The grid under “Who will you choose?” is edge-to-edge portraits with no card, no shadow, and no caption chip on the tile. Color lives in the portraits. The chrome stays black, cream, and white. News cards are photographs with a dark gradient and a date plus title; they are not glass panels.

`HEROES` in the bar uses an underline as the active state, not a filled pill. On `/hero/antimage` the portrait did not paint in this session. What did paint was a dark slate field, square icon buttons with hairline borders, and panels split by hairline vertical rules. That empty state is still useful: Dota’s own web chrome is flat, dark, and ruled, not glowing.

### What it does well

Identity is carried by artwork and by restraint in the chrome. A person recognizes Dota before reading a sentence, because the portraits and the black field are enough. Typography does the hierarchy: a large cream display line, a small tracked eyebrow, then body copy. One red mark punctuates a section. It is not a theme.

### Patterns worth keeping as principles

- Artwork is the color. Interface chrome stays quiet so the portrait can be loud.
- Active navigation is an underline or a hairline, not a colored capsule.
- Buttons that mean “go” can be outlined. A fill is reserved for the single primary action.
- Section breaks are hairlines and a short accent rule, not cards nested in cards.
- Corner radius on the official site is effectively zero. Sharpness reads as the game client, not as a consumer app.

### What not to copy

- The marketing layout: giant quote, three news cards, a hero mosaic. That is a campaign page, not a statistics tool.
- Radiance, Reaver, and the official wordmark. Those are Valve’s faces and marks.
- The exact red rule as a global accent. Repeated, it becomes “red everywhere,” which this brief forbids.
- The homepage’s violet fog. That color is in one illustration. It is not a UI palette. Turning the app purple because the 2026 homepage art is purple would fake a brand color the chrome does not use.
- Exact panel textures, ability frames, and HUD ornaments from the client.

### Principle, and where it lands

Dota’s web chrome is a dark stage. Color is spent on the subject (the hero), and on one punctuation mark. Passport should use the same economy: warm-black surfaces, cream type, portraits at the identity moments, and a single metal accent for selection. Win and loss get their own pigments later, because this marketing site does not show match outcomes.

Applied to: the app shell, the player header, hero rows, and the rule that red is not the brand color.

## 2. Linear — discipline

Observed: `https://linear.app/` on 1 October 2026, including the embedded product frame on the marketing page. The signed-in app was not opened.

### What was on screen

Marketing canvas computed to `rgb(8, 9, 10)` with text `rgb(247, 248, 248)`. The typeface is Inter Variable. The headline is 64px on 64px, weight 510, tracking about −1.4px. The only high-contrast control in the marketing bar is a white `Sign up` pill. Everything else is quiet type.

Inside the product frame: a narrow left list (workspace, Inbox, My issues, Projects, Favorites). A search icon sits in that list, not in a giant header. The issue itself is one elevated panel with a hairline edge. The title is the largest type in the panel. Metadata (issue id, project, date) is smaller and dimmer. A right inspector is a second panel, not a stack of cards. Color appears as a status dot and as a tiny green/red diff. The selected favorite is a slightly lighter row, not a brand-colored button.

### What it does well

A dense tool stays calm because emphasis is scarce. Most of the screen is type, alignment, and one surface step. The eye lands on the title, then the activity, then the inspector. Borders exist to separate regions, not to decorate them.

### Patterns worth keeping

- One primary surface step above the canvas. A second step only for an inspector or a menu.
- Selected navigation is a luminance change plus position, not a new hue.
- Identifiers (issue ids) are present and muted. They are how you scan, not how you shout.
- The headline can be large and tight. Body and metadata stay small. The gap between those two sizes is the hierarchy.
- Search is always one gesture away, and it does not dominate the page when unused.

### What not to copy

- Inter, the Linear wordmark, the nearly pure cool black, and the white pill as our brand button. Those are their look. The brief asks for their discipline.
- Issue workflow chrome (cycles, triage, agents). Irrelevant.
- Their marketing scale (64px headlines) on data pages. A player page that opens with a 64px slogan wastes the first screen.

### Principle, and where it lands

Restrained borders, a short spacing scale, and a steep type hierarchy keep a lot of facts readable. Apply that to Player Overview, Match History, Hero Statistics, Duo, and account settings: one title, a few numbers with their window written next to them, then a table. Do not introduce a new color to mean “this section exists.”

## 3. Vercel — navigation structure

Observed: `https://vercel.com/`, `https://vercel.com/docs`, `https://vercel.com/login?next=/dashboard`, and the changelog entry `https://vercel.com/changelog/dashboard-navigation-redesign-rollout` (26 February 2026). The dashboard itself redirected to login and was not inspected.

### What was on screen

The marketing site is a near-white field, black type, one black filled button, and one ghost button. The docs site is the closer structural reference: a left column with a search field that shows `⌘K`, grouped links, disclosure chevrons, and a content column whose tabs are underlines (`Deploy an app`, `Set up your agent`, `Call a model`). Cards on that page are white, lightly bordered, and hold an icon, a title, and one sentence. The page background is a cool gray, not the card color.

The login screen is a single centered column: one field, one black primary button, then outline buttons for other methods. No sidebar, no illustration.

The changelog, which is Vercel’s own description of the dashboard that became default on 26 February 2026, states:

- horizontal tabs moved into a sidebar that can be resized and hidden;
- the same tab set is used at team level and project level;
- order follows the common workflow;
- a project acts as a filter so the same page can be read at two scopes;
- mobile uses a floating bottom bar meant for one hand.

Those five points were read as text. The dashboard pixels were not seen.

### What it does well

Scope is explicit. You always know whether you are in the team or in one project, and the navigation does not rename itself when the scope changes. Search is part of the docs chrome. Tabs are a second level under the sidebar, not a third navigation language.

### Patterns worth keeping

- A persistent sidebar for destinations, tabs for modes of the current page.
- Collapse and resize, so a data table can take the width.
- One search entry that is keyboard-addressable.
- Mobile does not keep a 240px sidebar. It changes navigation shape.
- The docs active state is positional (underline, current section), consistent with Dota’s underline and Linear’s row.

### What not to copy

- White canvas, Geist, the triangle mark, black pills, and the cool gray marketing field.
- A floating bottom bar if it becomes a glass capsule. The principle is “thumb-reachable primary destinations,” not the specific floating treatment.
- Project/team switching as a literal metaphor. Our scope switch is the player, not a Vercel project.

### Principle, and where it lands

Destinations live in a sidebar. Modes of one destination live in tabs. The player is the scope: Overview, Matches, Heroes, and that player’s meta stay put while the id changes. Meta and Duo are global destinations because they are not “a tab of one player” in the same way. Desktop can hide the sidebar. Tablet starts collapsed. Mobile replaces it with a bottom bar of the five daily destinations, with search and profile in the top bar.

## 4. Raycast — reach

Observed: `https://www.raycast.com/` on 1 October 2026.

### What was on screen

The first screen is a black field, a white headline, and a red diagonal graphic. That red field is marketing art. It is the pattern this product must not inherit: a large red gesture with no data on it.

Further down, the product is a floating dark panel over a desktop. The panel has a single field, “Type to filter entries…”, a grouped list (`Today`), a selected row drawn as a lighter bar, and a side menu of actions with shortcut hints (`Copy to Clipboard`, `Share…`, `Open With…`). A filter chip (`Images Only`, `All Types`) sits in the panel rather than on a separate page. The result and the preview share one surface.

### What it does well

The interface assumes you already know what you want and refuses to make you walk a menu to get there. Filtering, selection, and the next action are in the same panel. Keyboard hints are visible, so the mouse path and the key path teach each other.

### Patterns worth keeping

- One palette, summoned from anywhere, that searches the objects the product already understands.
- Results grouped (recent, then matches), with the first row selected.
- Actions on the selected object, not a second search.
- Compact rows: mark, title, one piece of metadata.

### What not to copy

- The red slash, the desktop wallpaper, the menu-bar toy, and the clipboard-history preview.
- AI chat as the center of the palette. Our palette finds a player or a hero and runs a command. It does not answer in prose.
- A promise of “saved players” that the product cannot store. Passport has a session cookie and no user database. Recent players can live in the browser. A saved list waits until there is a real store.

### Principle, and where it lands

Important objects are reachable in one shortcut. `Ctrl` or `Cmd`+`K` opens player and hero search. Commands on a hit: open the passport, open matches, open heroes, start a Duo with this id, copy the link, open Compare. Recent ids are local. The palette is an accelerator over pages that already exist, not a new product surface with its own numbers.

## 5. OP.GG, U.GG, Tracker — statistical clarity

### OP.GG

Observed: `https://op.gg/` and `https://op.gg/lol/champions` (title: tier list for patch 16.19). Cookie dialog dismissed with `DISAGREE`. Mobile width 390 checked on the champions page.

Desktop champions page, behind and then without the dialog:

- A blue product header and a second link row: Home, Champions, Game modes, Leaderboards, Pro spectate, Stats.
- Title states the slice in one line: ranked solo/duo, all roles, Emerald+, patch 16.19.
- Freshness is a sentence: list updated 35 minutes ago, 14,015,978 analyzed samples.
- Filters are compact menus: All servers, Emerald, Patch 16.19.
- Role modes are tabs: All, Top, Jungle, Middle, Bottom, Support. The active tab is a filled blue rectangle.
- The table columns that were visible: rank, champion (portrait plus name), a letter tier, a role mark, win rate, pick rate, ban rate, and a “weak against” cluster of small portraits.
- A left rail of champion icons acts as an index into the same table.

What is good: the slice, the patch, the sample, and the time of update are on the page before the first percentage. You can scan a row as portrait, name, rate, rate. Opponent portraits in the last column are a picture of “who,” which is faster than another number.

What not to copy: the blue header, letter tiers, the ad slot, “remove ads,” and the role model. League roles are not Dota lane roles, and they are not positions 1–5. Our meta already refuses S/A/B tiers and refuses to invent a public ban rate. The champions page also puts a large empty and advertising region above the table.

Mobile: the top became a search field plus a horizontally scrolling nav (`Champions`, `Game modes`, `Leaderboards`). The tier table was not on the first screen. A wide empty dark region sat under the search. That is the failure mode to avoid: the phone keeps the chrome and postpones the data.

### U.GG

Observed: `https://u.gg/`. A consent dialog covered the center. Around it:

- A left icon rail for sections.
- A red `Download Now` and a `Try PLUS` path. The commercial tier is visually louder than the stats.
- A champion card in the background: portrait, name `Coralville #267`, an `S+` mark, an LP delta, then four figures in a row — KDA 2.33, win rate 38% in red, pick rate 3.9%, games 24.
- Search placeholder: “Search Yourself or a Champion.” One field accepts both kinds of object, which matches a useful search principle, provided the results are labeled as different kinds.

What is good: the identity card answers “who” and “how is the recent number” before any essay. Win rate is allowed to look bad. Games sit next to the rate so 38% is not read without 24. KDA, rate, pick, and games are one horizontal scan.

What not to copy: `S+`, LP treated as a verified rating, the left rail of unexplained icons, the red download button, and a plus upsell as the hero of the page. A 38% with 24 games is exactly the case where our product must also say the sample is thin, not only color the percentage.

### Tracker Network

Observed: `https://tracker.gg/`. A consent dialog covered a game-tile grid and a red banner whose visible words were “INSIGHT TO EVOLVE YOUR GAME.” Tiles are illustrated covers for many games. Premium and sign-in sit in the corner.

What is good: the home page is a directory. You pick a game, then a player. The tile is the identity object.

What not to copy: the red billboard, the multi-game directory (we are one game), and premium as a visual system. A statistics home that leads with a slogan in a red block is the “old gaming website” failure the brief names.

### Principle, and where it lands

A gaming stats screen is scannable when each row has a portrait, a name, a rate, and a count, and when the slice is written once above the table. Color may reinforce a rate. It may not replace the count, the window, or the words. Apply this to match rows, hero rows, and the player header. Do not apply letter tiers, LP, or a role icon we cannot source.

## 6. Grafana — analytical clarity

Observed: `https://play.grafana.org/` returned “Grafana is starting up…” and “Error loading Grafana” in this session, including the play-home dashboard URL. The product UI was therefore taken from the public marketing page `https://grafana.com/`, which embeds dashboard screenshots. Those screenshots are Grafana’s own current marketing, not a clicked-through live dashboard. That limit is recorded so the tokens are not pretended to be sampled from play.grafana.org.

### What was visible in the embedded panels

- A dark panel titled “Cost Management and Billing” with tabs (Usage, Usage alerts, Invoices, Settings) and a range label, “October 2025 Billing Period.”
- Three large figures (`$1.09k`, `$989`, `$26.4`) each in its own blue tile.
- A second panel with a time-series chart, a legend, and a query field beside an assistant.

### What it does well

The range is a label, not a guess. Tabs change the contents of one panel. A chart has a legend so two lines are not anonymous. The figure and the breakdown live in the same panel.

### What not to copy

- Three saturated blue KPI tiles. That is the generic dashboard the brief rejects, and it was on Grafana’s own marketing page. Our numbers sit on the same surface as the page, with the window in a caption, not in a colored slab.
- Rainbow series, grid wallpaper, and panel chrome that looks like an operations tool.
- A query editor. Players do not write queries.

### Principle, and where it lands

Every chart names its window, its series, and its sample. A missing window is an empty state, not a line through zero. Time comparisons that we cannot source (MMR over months, patch-letter splits) do not get a chart with invented points. Where we do have a series — heroStats trend points, last-20 form, a Duo window — the chart is a thin line on the panel surface, in the accent and a muted second series, with a legend.

## Cross-reference

| Need | Observed source | Take | Leave |
| --- | --- | --- | --- |
| Atmosphere, portraits, chrome | Dota 2 site | Black stage, cream type, hairline, one punctuation mark, portraits as the color | Layouts, wordmark, fonts, red as a wash, purple fog |
| Hierarchy and density | Linear marketing + embedded app | Surface steps, muted ids, selected row by luminance, steep type scale | Inter, cool black, white pill, 64px slogans on data pages |
| Sidebar, tabs, collapse, mobile nav | Vercel docs + 26 Feb 2026 changelog | Sidebar for destinations, tabs for modes, hideable sidebar, mobile changes shape | White theme, Geist, floating glass bar, unseen dashboard pixels |
| Fast search | Raycast panel | One palette, groups, selected row, actions with shortcuts | Red slash, AI chat, saved-player fiction |
| Profile and tables | OP.GG champions, U.GG card | Slice in the title, n beside the rate, portrait rows, freshness | Letter tiers, blue header, ads, LP, League roles |
| Charts | Grafana marketing panels | Named range, legend, one panel | Blue KPI slabs, query editor, play site (it did not load) |
