# Design direction

Status: visual source of truth for later phases. Not implemented. Research basis: `DESIGN_RESEARCH.md`, 1 October 2026.

The product should feel like a Dota match looked at by someone who builds precise tools: a dark stage, the hero and the player as the only loud images, and numbers that can be scanned. It should not feel like a paper passport on a teal desk (that is the current implementation), and it should not feel like a blue esports portal, a white SaaS dashboard, or a red gaming billboard.

## The three layers, after looking

**Dota is the stage.** The official site spends color on portraits and keeps the chrome black, cream, and white, with one short red rule. We keep the stage and the portraits. We do not keep the rule as a brand color, because a statistics product would repeat it on every active control.

**Linear is the discipline.** One surface step, a steep type scale, selection by luminance, identifiers present but quiet. We do not wear Inter or their cool black.

**Vercel is the skeleton.** Destinations in a sidebar that can hide. Modes in tabs. Mobile changes the skeleton instead of shrinking it. The February 2026 changelog is the source for that skeleton; the dashboard pixels were behind login.

**Raycast is the shortcut.** One palette over objects we already have.

**OP.GG and U.GG are the scan.** Slice written once, portrait plus rate plus count. Their blue chrome, letter tiers, and LP are not ours.

**Grafana is the caption on a chart.** Named range, named series. Their blue KPI tiles are the anti-example.

## Feeling

Competitive, dark, warm, precise. The warmth is the difference from a cool developer tool: the black is slightly brown, the type is cream, the accent is brass. Brass is the metal already visible in Dota’s esports artwork (the gold emblems on the news cards). It marks selection and focus. It does not paint large areas.

Red and green exist only as match outcome, and they are dulled so they do not glow. A win is also the word or the mark `W`. A loss is also `L`. Color is never the only channel.

## What this is not

- Not the current paper sheet on a teal desk. That look is honest and calm, and it reads as a document. The next look reads as a client for competitive data. This file does not change the running CSS.
- Not a generic SaaS dashboard: no six identical rounded stat slabs, no cool gray canvas, no Inter, no purple gradient.
- Not an AI dashboard: no assistant panel, no glowing prompt, no blob.
- Not an old fan site: no stone texture, no metal borders, no fire, no red billboard.
- Not neon, not glass, not a hero illustration behind every page. Artwork appears where a person or a hero is the subject. A match table does not sit on a painting.

## App shell

Desktop, from 1100px up:

- Canvas: warm black.
- Left sidebar, 232px, resizable down to 200 and up to 280. Collapsed width 56px, icons only, tooltip on focus and hover.
- Sidebar order, top to bottom: wordmark as text “Passport”, search button (`Ctrl`/`Cmd`+`K`), then destinations.
- Destinations: Overview (the player in scope, or the home search if none), Matches, Heroes, Meta, Duo, Profile. Compare is not a sixth daily item. It is reached from Duo, from the palette, and from Profile. Stuffing every route into the sidebar recreates the current top-bar sprawl.
- Main column: a top bar with the scope (player name, or “Мета”, or “Дуэт”) and the page tabs. Content below is one surface, not a stack of floating cards on a different color.
- The sidebar can hide. Hiding it is for tables. The choice persists locally.

Tablet, 760–1099px:

- Sidebar starts collapsed.
- Opening it overlays the content. It does not push the table to a 320px column.

Mobile, under 760px:

- No sidebar.
- Top bar: wordmark, search icon, profile.
- Bottom bar, solid, not floating glass: Overview, Matches, Heroes, Meta, Duo. Five items. Labels under icons. The active item uses the brass rule, not a filled capsule.
- Page tabs become a horizontal scroll under the top bar.

Active destination: cream type, a 2px brass rule on the leading edge, background one step lighter than the sidebar. Hover: the lighter background without the rule. Focus: a 1px brass ring, 2px offset, visible on keyboard only if the pointer is not the input — always visible for keyboard focus.

## Player profile, as the center

The first screen answers, in this order:

1. Who. Avatar, persona name, account id in muted figures, link to the Steam profile. The avatar is rectangular with a 2px radius, not a circle. Circles are the generic app default. Dota portraits are frames.
2. Standing. Medal from `rank_tier` when it exists. Leaderboard rank when the source sent one. No estimated MMR in this header, ever. If the medal is missing, the slot is absent, not a fake badge.
3. Record, with the window in the caption. Significant win-loss is one figure. The patch-bucket record is a second figure. They are not averaged and not labeled as one “win rate.”
4. Recent form. The last 20 as a row of W/L marks. Not a sparkline that pretends to be a trend against the previous 20 unless that comparison is actually computed from enough matches.
5. What they play. Hero portraits, games, win rate, sample mark.
6. Where. Lane-role mix from counts. Not positions 1–5. The words on screen stay Safe, Mid, Off, Jungle, unknown.
7. What changed in this patch bucket. Heroes in the current bucket against that player’s own baseline. This block is the existing “своя мета,” given a visual form in `PAGE_DESIGN_SPEC.md`. It does not subtract the public win rate.

The header is one horizontal band on desktop: portrait, identity, then three figures. On mobile the portrait and name stack, and the three figures become a single row that scrolls if needed rather than six tiles.

## Player × meta

This block must be recognizable as ours.

Two labeled columns share a hairline:

- Left, “Этот игрок”. Patch-bucket games, wins, rate, and the Wilson note. The baseline is that player’s own patch record.
- Right, “Публичная мета”. The heroStats slice, with its own picks and rate. Caption: this is not the patch bucket.

The space between them is intentional. There is no third column called “разница” that subtracts the right from the left. The product rule is that those slices are not the same window. A status word sits under the row instead: мало игр, знакомый и устойчивый, свой герой, только мета, мало данных. Those words already exist in the logic. The design gives each status a quiet mark (brass, cream, muted, warning) and never a sentence “выше меты.”

Heroes with no games in the bucket do not appear in the grid. Empty quadrants stay empty, with the quadrant title and the phrase “здесь пусто,” not filler portraits.

## Duo

Duo is a shared history, not a compatibility percentage.

The header is two identity bands and the word “вместе” between them, set in small tracked type, not a plus icon the size of the names. Under that:

- Games in the same team, in this patch bucket, and whether the window was cut at 60.
- Observed rate, expected rate, and the delta in percentage points, each with its name.
- The score is visually secondary. If the sample is under the support threshold, or the interval crosses the expected rate, the score is muted type and the status line is “вывода нет.” A 100% on one game must not be able to look like a conclusion. The large number on a thin sample is the games count, not the percentage.
- Hero pairs and lane pairs follow, each row carrying n. A pair badge exists only at the pair threshold already used in the product. Lane text stays “safe + mid,” never “carry + support,” and never “лучше всего” from match wins.
- Against-counts are a separate block titled as opponents. Same team, party, and opponents are three labels. Party stays “неизвестно,” because the match list does not prove a party.

## Search palette

`Ctrl`/`Cmd`+`K`, and the search button. The panel is a surface-elevated rectangle, 560px wide, 10px radius, anchored near the top of the viewport. Field, then groups: recent local players, heroes from the catalog, player-name hits. Heroes and players are separate groups so a name cannot silently open the wrong kind of page.

Commands on a selected player: открыть паспорт, матчи, герои, в дуэт, сравнить, копировать ссылку. Commands on a hero: открыть героя, открыть в мете. Enter runs the first command. The palette does not show win rates it would have to fetch. It shows name, id, and last match time when the search payload already has them.

## Motion, in one paragraph

Motion confirms a change of state. Sidebar collapse, tab underline, palette open, and row hover are 120–160ms. Charts may draw once, 200ms, and then sit still. Nothing floats, pulses, or glows. `prefers-reduced-motion` cuts these to opacity changes under 80ms or to none.

## Responsive rule

On a phone the first screen of every page is the identity and the primary number, then the filters, then the rows. Chrome that only existed to mirror the desktop sidebar is deleted, not shrunk. Tables become rows with the portrait and the rate on the first line and the secondary stats on the second. A table that must stay a table (match detail scoreboard) scrolls inside itself, and the page does not.

## Validation

1. Generic SaaS dashboard? No. The canvas is warm-black, the accent is brass used once per control, stat slabs are not the layout, and the type is not Inter on cool gray.
2. Generic AI website? No. There is no assistant, no gradient mesh, no prompt.
3. Old gaming website? No. No texture, no red billboard, no faux-metal frame. The Dota cues are the stage, the portraits, and the hairline.
4. Obviously Dota? Yes, at the moments that matter: hero and player images, radiant/dire outcome colors used sparingly, cream on near-black, competitive density. The chrome does not need a logo lockup to be recognizable.
5. Are the data the priority? Yes. The largest type on a player page is the persona name, then the records. Decoration does not sit behind the numbers.
6. Modern enough for 2026? Yes, by the skeleton we actually saw: hideable sidebar, tabs as modes, command palette, tight type, almost no shadow.
7. Readable when there is a lot of it? Yes, if rows stay on one surface and color is limited to outcome, sample warning, and selection. That rule is in the tokens.
8. Consistent across pages? Yes. One shell, one table pattern, one header pattern. Meta, Duo, and Profile reuse them instead of inventing cards.
9. Mobile usable? Yes, if the bottom bar holds five destinations and the first screen holds data. The OP.GG mobile miss (search, then a void) is called out so we do not repeat it.
10. Subtle enough? Yes, as long as brass stays on the active rule and the focus ring, red stays on losses, and portraits are the only saturated images. If a later screen adds a red glow, a full-bleed hero, or a tier letter, it has left this direction.
