# Design decisions

Date: 1 October 2026. These decisions govern the visual work. The warm-black stage is now the running UI.

## 1. The paper-and-teal UI was the first skin

The app began as a cream sheet on a dark teal desk, with Literata headlines and large radius. That read as a document. The running interface now uses the warm-black stage in `DESIGN_DIRECTION.md`. Literata is no longer loaded. Source Sans 3 and IBM Plex Mono are.

## 2. Brass is the accent, not red

The Dota site uses a short red rule as punctuation and keeps buttons white and outlined. A statistics product would repeat an accent on every current tab, every focus ring, and every link. If that accent is red, the interface becomes the “red everywhere” look the brief forbids, and red stops meaning “loss.” Brass is the other metal already in the esports artwork on that homepage. Red is reserved for losses, and even then it is dull and paired with the letter L.

## 3. We do not wear the reference brands

Inter, Geist, Radiance, Reaver, the Linear wordmark, the Vercel triangle, the OP.GG blue bar, and the Tracker red billboard were all visible and are all rejected as our skin. Source Sans 3 stays the planned UI face because it is already the app’s text face and it is none of those. Literata leaves when the new direction is built, because a serif on cream is the paper system.

## 4. The sidebar is a destination list, learned from Vercel’s changelog, not from a logged-in dashboard

`/dashboard` redirected to login, so the dashboard pixels were not reviewed. The decision to use a hideable sidebar, tabs for modes, and a different mobile shape comes from the docs chrome we did see and from Vercel’s 26 February 2026 changelog, which describes that redesign in text. We do not copy a floating glass bottom bar. The mobile bar is solid, five items, labels visible.

## 5. The command palette does not invent a saved-player account

Raycast groups recents and actions in one panel. We take that. Passport has no user database. Recent players, if built later, are local to the browser. “Saved players” is not a command until a store exists. The palette also does not display win rates it would have to fetch. Search stays a way to open a page, not a second statistics surface.

## 6. Letter tiers, LP, and estimated MMR are not visual components

OP.GG’s tier letters and U.GG’s `S+` and LP are clear, and they are the wrong kind of clear for this product. A letter hides the sample. LP and `computed_mmr` are not the medal. RankBadge shows `rank_tier` and, when present, `leaderboard_rank`. If the medal is missing, the badge is absent. There is no RankBadge variant called “estimate.”

## 7. Positions 1–5 are not a column, even though the brief listed them

The design request named positions in the player profile. The product still has no verified position field. The visual system has RoleBadge for lane roles only: Safe, Mid, Off, Jungle, unknown. A later source, if it is verified, can add a position mark. Until then a position icon would be a fiction with a polished shape. Duo lane copy stays “safe + mid,” and it does not say a lane was won, because match win is not lane win.

## 8. Player × meta does not get a “difference” column

The brief’s example table subtracts global win rate from the player’s win rate. That subtraction is the sentence the product is not allowed to say. The two numbers can sit in two labeled columns because a reader can see they are different objects. The status words (мало игр, знакомый, только мета, and the rest of the existing quadrant language) are the judgment. A delta chip between unlike slices is not a component.

## 9. Uncertainty is a visual rank, not a footnote

U.GG will show 38% in red next to 24 games and still let the percentage be the loudest thing, plus a tier letter. Our rule is the opposite when the sample is thin or the interval crosses the baseline: the count is louder than the percentage, the percentage is secondary type, and the status line is always present. Duo’s score follows the same rule. A one-game 100% cannot occupy the display size. The games count can.

## 10. Charts only where a series exists

Grafana’s marketing panels show that a chart without a named range becomes decoration, and that three colored KPI tiles are the generic dashboard. We will not draw MMR over time, patch-letter splits, or a public-ban series. HeroStats trends draw only at two or more points. Last-20 form is a row of marks, not a line that implies a slope we did not compute. Matchup tables are not given a chart that would look more precise than the unknown population.

## 11. Matchup population stays unnamed

The live matchup payload is `hero_id`, `games_played`, `wins`. Anti-Mage’s sum was a few thousand games, Ember Spirit’s was larger, and neither payload said pro or public. The design caption says what the table is not (not the slice tabs, not `pub_pick`). It does not gain a “Pro” pill to look more certain.

## 12. One table pattern, not a card grid

OP.GG is understandable because a row is portrait, name, rate, count. Linear is understandable because those rows sit on one surface. The component list therefore has HeroRow, MatchRow, and DataTable, and it does not have a family of stat cards. Stat is a number and a caption, separated by a hairline. The six-up card grid is explicitly rejected in the validation.

## 13. shadcn is not a look, and it is not added now

The brief allows shadcn as infrastructure later. This phase does not install it. If it is added, default radius, shadow, and neutrals are overridden by `DESIGN_SYSTEM.md` before any screen uses them.

## 14. Russian remains the interface language

The references are English because those products are. Passport’s controls, empty states, and status lines stay Russian, including the sample words and the patch-letter sentence. The design system does not localize those strings into English “for a cleaner look.”

## 15. What would mean this direction has failed

A later screen has left the direction if it adds any of these: a purple or blue gradient page, a glass panel, a red outer glow, a tier letter, an MMR estimate beside the medal, a position 1–5 badge, a subtracted “vs meta” delta, a Duo percentage larger than the sample, a chart with no window, or a mobile first screen that is only navigation. The fix is to change that screen back toward `PAGE_DESIGN_SPEC.md`, not to add another accent to balance it.
