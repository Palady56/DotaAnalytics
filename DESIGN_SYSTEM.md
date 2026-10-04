# Design system

Status: implemented in `app/globals.css`, `components/AppShell.tsx`, and `components/CommandPalette.tsx`. The tokens below are the ones the interface uses. Colors are chosen, not sampled from a stylesheet we do not control, except where `DESIGN_RESEARCH.md` records a computed value and this file deliberately does not copy it.

## Color reasoning

The official Dota site’s chrome is black, white, and cream, with a short red rule and with saturated color confined to artwork. Linear’s chrome is a cool near-black (`#08090a`) and near-white type. If we take Linear’s black, the product becomes a developer tool that happens to mention heroes. If we take the red rule as the accent, every selected tab is a gaming cliché. The palette below is a warm black and a brass selection color so the stage feels like Dota’s metal and stone, while outcome colors stay dull and labeled.

Do not copy these roles onto large fills. Accent, win, and loss are for marks, rules, words, and thin chart lines.

### Semantic colors

| Token | Value | Why it exists |
| --- | --- | --- |
| `background` | `#0c0b0a` | Warm black. Dark enough to match the Dota site’s black stage, warm enough that it is not Linear’s cool `#08090a`. |
| `surface` | `#161411` | The page body and the sidebar. One step above the canvas so the shell is visible without a shadow. |
| `surface-elevated` | `#201c17` | Popovers, the command palette, the match inspector. A second step, used rarely. |
| `surface-hover` | `#2a241c` | Hover on a row or a nav item. Luminance only, so hover does not introduce a new hue. |
| `border` | `rgba(243, 239, 230, 0.08)` | Hairline. Separates rows and regions the way the hero page separated panels. |
| `border-strong` | `rgba(243, 239, 230, 0.16)` | The edge of a palette, a dialog, or a focused field. |
| `text-primary` | `#f3efe6` | Cream, close to the display type on the Dota homepage, easier to read in tables than pure white on warm black. |
| `text-secondary` | `#c4bdb2` | Captions, window labels, secondary rates. |
| `text-muted` | `#8a8378` | Ids, timestamps, disabled hints. Still above 4.5:1 on `surface` for body sizes at 14px and up; do not use it under 12px for essential facts. |
| `accent` | `#c6a36a` | Brass. Selection rule, focus ring, the single “you are here” mark. Chosen instead of the site’s red rule so red can remain an outcome. |
| `accent-ink` | `#1a140c` | Text on a brass fill, if a fill is ever required. Default controls are not filled brass. |
| `success` | `#8ea36a` | Win. A dull radiant green. It must sit next to the letter W or the word «победа». |
| `loss` | `#c45c52` | Loss. A dull dire red. It must sit next to L or «поражение». Not a glow, not a border around the page. |
| `warning` | `#d0a15a` | Thin sample, stale cache, truncated window. Same family as brass, reserved for caution so brass itself does not mean “danger.” |
| `info` | `#8e9ea3` | Neutral notes: source name, “срезы не совпадают”, patch letter versus bucket. Desaturated so it cannot be read as a win rate. |

### Chart colors

Keep to four. More series than that means the chart is the wrong form.

| Series | Token | Use |
| --- | --- | --- |
| Primary | `accent` | The player, or the hero being viewed. |
| Comparison | `#8e9ea3` | The other player, or the meta slice, always named in the legend. |
| Win | `success` | W marks, win portion of a small bar. |
| Loss | `loss` | L marks, loss portion. |

No gradient fills under lines. No rainbow categories. A lane mix may use one brass bar on a track of `surface-hover`, not a new color per lane.

### Status of a number

| State | Treatment |
| --- | --- |
| Enough sample, and the interval agrees | Primary type. Outcome color only if the number is a win rate the reader is meant to judge. |
| Interval crosses the baseline | Secondary type. No outcome color. Caption «вывода нет» or «интервал пересекает базу». |
| Thin sample | Warning-colored caption «мало игр». The percentage stays, in secondary type, so it cannot outrank the count. |
| Source failed | The block is an error line. It is not a zero and not a gray chart. |
| Unknown population | The caption names the endpoint and says what the number is not. Matchups already do this. The visual system does not invent a “pro” or “pub” pill the payload did not contain. |

## Typography

Do not use Inter (Linear), Geist (Vercel), or Radiance/Reaver (Dota’s proprietary faces).

Recommended pairing for the later implementation, because it is already loaded by the app and is not those three:

- UI and display: Source Sans 3. One family, so the product does not grow a decorative serif “for flavor.” The current Literata headlines belong to the paper direction and are retired when this system is built.
- Figures in tables: Source Sans 3 with tabular lining numbers, so win rates and ids align.
- Identifiers that must not look like words (match id, account id): a mono face at 12–13px, muted. Candidate when implementing: IBM Plex Mono. Do not introduce it in this phase.

### Scale

| Role | Size / line | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| Display | 32 / 36 | 560 | −0.02em | Player name on the overview only. |
| Title | 22 / 28 | 560 | −0.015em | Page title when there is no player name. |
| Heading | 16 / 22 | 600 | 0 | Section titles inside a page. |
| Body | 15 / 22 | 400 | 0 | Paragraphs, empty states. |
| UI | 14 / 20 | 450 | 0 | Nav, tabs, table cells, buttons. |
| Caption | 12 / 16 | 450 | 0.01em | Window labels, freshness, sample notes. |
| Mono | 12 / 16 | 400 | 0 | Match id, account id. |

Do not set a data-page title at 64px. That size was Linear’s marketing headline.

Weights stay in a narrow band. 700 is reserved for the one number the section is about, and only at UI size or above. A page of bold percentages is a page with no hierarchy.

## Spacing

Base unit 4px.

| Token | px | Use |
| --- | --- | --- |
| `space-1` | 4 | Icon-to-label, W/L marks. |
| `space-2` | 8 | Inside a table cell, between a caption and a number. |
| `space-3` | 12 | Row padding, nav item padding. |
| `space-4` | 16 | Section gap inside a panel, sidebar item gap. |
| `space-5` | 24 | Gap between sections. |
| `space-6` | 32 | Page padding on desktop. |
| `space-7` | 40 | Only the top of the player header. |

Mobile page padding is 16, not a shrunk 32. Do not invent 20, 28, or 18 as one-off gaps.

## Radius, border, elevation

| Token | Value | Use |
| --- | --- | --- |
| `radius-0` | 0 | Hairline rules, the brass active rule. |
| `radius-1` | 2px | Buttons, fields, portraits, table frame. Matches the sharp client more than a 16px card. |
| `radius-2` | 6px | Palette, dialog, menus. |
| `radius-full` | 999px | Not used for buttons or cards. Allowed only for a 6px sample dot. |

Border is 1px `border`. The strong border is for overlays. No 2px colored outlines around cards.

Elevation is the surface step. Shadow is allowed only on the palette and dialogs: `0 16px 40px rgba(0, 0, 0, 0.45)`. No shadow on rows, stat blocks, or the sidebar. The current paper sheet’s large soft shadow belongs to the old direction.

## Interaction

| State | Visual |
| --- | --- |
| Default | Surface, primary or secondary type, 1px border only where a region needs an edge. |
| Hover | `surface-hover` on the row or nav item. No lift, no glow. |
| Active / selected | Brass 2px leading rule or a 2px underline. Type becomes primary. |
| Focus | 1px `accent` ring, 2px offset, on top of the element. Never remove it. |
| Disabled | 40% opacity, no hover, `aria-disabled` or `disabled`. |
| Busy | The existing content stays. A 1px brass line may travel once along the top of the block. Do not replace a table with a skeleton that flashes. |
| Error | `loss` is not used. Errors use `warning` type on the caption and a sentence. A failed source is not a lost match. |

Hit target: 40px on mobile, 32px on desktop for nav and icon buttons. Table rows may be 36px if the whole row is not the only target and the link inside meets 32px.

## Motion

| Token | Duration | Use |
| --- | --- | --- |
| `motion-fast` | 120ms | Hover, underline, color. |
| `motion-base` | 160ms | Sidebar width, palette opacity and 4px translate. |
| `motion-slow` | 200ms | A chart’s first draw. |

Easing: `cubic-bezier(0.2, 0, 0, 1)`. No bounce, no overshoot. Reduced motion: durations become 1ms, translate becomes 0.

## Layout

| Token | Value |
| --- | --- |
| Sidebar expanded | 232px |
| Sidebar collapsed | 56px |
| Top bar | 48px |
| Bottom bar | 56px plus the safe area |
| Content max | 1200px inside the main column. Tables may use the full main column when the sidebar is hidden. |
| Palette width | min(560px, 100vw − 32px) |

Breakpoints: 760 and 1100, as in the direction. Do not add a third “large desktop” layout that only increases card padding.

## Iconography

Use a single 16px stroke set, 1.5px stroke, rounded caps, current color. Do not mix filled illustration icons with strokes. Hero and item images are the only pictorial elements. Rank medals, if drawn, are small and literal (the medal name is still text beside them). Do not draw a custom crown, sword, or rune as decoration.

## Content rules that affect visuals

These are product rules. The visual system must not be able to violate them by making a forbidden number look official.

- Patch letter and patch bucket are two captions, never one badge.
- `computed_mmr` is not shown.
- Positions 1–5 are not a badge, a column, or an axis.
- Lane roles use the existing names.
- Public ban rate is absent except the pro slice, labeled as pro bans.
- Letter tiers S/A/B are not a component.
- Duo score, pair badge, and “реже/чаще” only appear inside the thresholds the logic already uses.
- Two sources are never averaged. If a number is OpenDota, the caption can say so in `text-muted`. A second source does not get a competing figure on the same row.
- Russian UI. Numerals use `ru-RU` grouping, as they do now. The design system does not switch the product to English.

## shadcn

If a later phase adopts shadcn, it is a behavior library: focus trap, menu keyboarding, dialog. Every imported component is restyled onto these tokens before it is used. Default shadcn radius, card shadow, and neutral palette are not allowed to ship. This phase does not add the dependency.
