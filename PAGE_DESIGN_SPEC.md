# Page design specification

Status: how each existing surface should look when the design system is adopted. Routes stay. This file does not add pages that the product rules forbid (leaderboards, position pages, share images, a public MMR chart).

The shell on every page is AppShell. The first screen on a phone is identity or the page question, then the primary number, then rows.

## Player overview

Route: `/players/{id}`.

Purpose: who this person is in public data, in three windows that stay separate.

Desktop, top to bottom:

1. PlayerHeader. Portrait, persona, Steam link, account id, medal if `rank_tier` exists, leaderboard number if it exists. Figures: significant record, current patch-bucket record, last-20 W/L marks. Each caption names the window. The official patch letter sits in a caption with the bucket name, as two facts.
2. A short row of links as tabs: Обзор (current), Матчи, Герои, Своя мета. These are the player-scoped modes. Meta and Duo stay in the sidebar because they are not this player’s private tabs. «Герои» can be the heroes section on this page until a separate route exists. Do not invent a heroes route in the visual spec just to fill the nav. If the sidebar item «Герои» is global, it opens `/meta`. The player’s own pool is the section below and the tab «Своя мета».
3. Lane-role mix and mode mix. Horizontal bars in brass on a quiet track. Labels are the lane-role names and the mode names. No position axis.
4. Hero pool. HeroRows sorted by the page’s existing sorts (games, robust, raw). Sample marks stay. A hero under 20 games does not get a “strong” treatment.
5. Recent matches, five to ten MatchRows, and a link to the full history.
6. The share paragraph and the copy control, visually quiet, at the end. It is a tool, not a hero banner.

Owner state: a single line «это вы» and the refresh action. Cooldown is a caption.

Empty and error: a missing block shows its own error. The header still renders if the profile arrived. Zeros are not substituted for a failed heroes list.

Mobile: header stacks. Lane bars and the hero list are the next things, not a grid of six tiles. Recent matches are rows.

## Matches

Route: `/players/{id}/matches`.

Purpose: scan a page of public matches.

Top: compact PlayerHeader (name and portrait only, no repeat of every KPI) and FilterBar. The active filter sentence is visible: patch bucket or “без фильтра патча”, mode, lobby, hero, lane, side, result. Turbo is not inside the default significant set unless the filter says so.

Then DataTable / MatchRows. Columns on desktop: result, hero, KDA, lane role, mode, duration, time. Party is not a column. `party_size` without `party_id` is not a party mark.

Pagination is text links, «Назад» and «Дальше», with the offset stated. No infinite scroll. Infinite scroll hides the page boundary the product already proved.

Mobile: filters in a disclosure after the first page has painted, with the active sentence always visible. Rows are two lines.

## Match details

Route: `/matches/{id}`.

Purpose: one match, readable as two sides.

Header: match id in mono, duration, mode, lobby, region if present, and parsed or not. Unparsed is a caption, and the sections that need parsed data are absent rather than empty grids.

Two columns, Radiant and Dire, named as those sides. The player who was linked from a passport is marked with a brass rule on their row, not a glow. Each row: hero portrait, name or «скрытый игрок», KDA, and items if the payload has them. Items are small images, not a build recommendation.

Draft, if the arrays exist. If they do not, the section is omitted.

No timeline, no role-impact score, no comeback label. Those are out of scope until the fields and the model exist.

Mobile: Radiant, then Dire, full width. The scoreboard does not try to stay two columns of 160px.

## Heroes

Route: `/heroes/{id}`, and the meta index `/meta`.

### Meta index

Purpose: heroStats, one slice at a time.

Title is the slice sentence that already exists (public, turbo, pro, or a medal column). Views are tabs: сильные, популярные, все. «Сильные» remains Wilson order with the minimum sample. Immortal stays empty if the source is empty.

HeroRows or DataTable: portrait, name, picks, rate, Wilson lower, pick share. Ban column only on pro, labeled pro bans. Sparkline only when the trend has at least two points, and the caption says it is the heroStats series, not a patch delta.

No tier letters. No position filter.

### Hero page

Purpose: one hero in the selected slice, plus the matchup list that is not that slice.

Header: portrait, name, attribute, roles from the catalog. Slice tabs are the existing chips, restyled as text tabs with a brass underline, not filled blue rectangles.

Figures for the slice: picks, rate, Wilson lower, rank among the eligible. A zero-pick slice is an empty sentence. The other slices are not copied in to fill it.

Rank columns stay a compact table.

«Против других героев» stays visually separate: a hairline and a caption that the table does not follow the slice tabs, that the sum of games is the population, and that it is not `pub_pick`. Rows: portrait, games, wins, rate, delta to that table’s own baseline, and the verdict word. Thin rows say «мало игр». The words «контрит» and «выше меты» do not appear.

If a player query is present, their lifetime games on this hero are a separate band with the existing “срезы не совпадают” caption.

Mobile: slice tabs scroll horizontally. The matchup list is rows, not a wide table. The independence caption stays above the list so a phone user still sees that Turbo did not change it.

## Meta, as a destination

The sidebar item «Мета» opens `/meta`. It is the public table, not the player’s quadrants. The player’s quadrants are «Своя мета» and are only in scope when a player id exists.

## Duo

Route: `/duo/{lo}/{hi}` and the form `/duo`.

The form is two PlayerSearch fields and a submit. It does not show a preview score before the page loads.

The result page:

1. Two compact identities and the word «вместе».
2. SynergySummary, with the games count dominant and the score quiet unless the status is a real above or below.
3. Caption if the window was truncated at 60, and the peers caption if the shared list failed («грубая сводка»).
4. Hero pairs. A pair under the badge threshold has no badge. 100% on two games is «мало данных».
5. Lane pairs, labeled with lane roles, without a “best” crown.
6. Opponents, separate, with a verdict only at the existing against-threshold. Zero against is «вердикта нет».
7. The party sentence: same team is not a party. The link to Compare, with the sentence that Compare is not this score.
8. Shared matches as MatchRows.

A low-sample page should look unfinished on purpose: large n, small percentages, status in warning or muted type. It should not look like a verdict with a decimal.

Mobile: identities stack. The summary figures stay above the pairs. Pairs are rows.

## Compare

Route: `/compare`.

Two fields, then ComparisonPanel. No third “winner” column. Observed differences are per figure, with both windows labeled. The link to Duo is a text link under the panels.

Mobile: one player, then the other. A difference is written under the second figure («значимые победы: 54% и 49%»), not as a floating delta chip that hides the windows.

## Profile

Route: `/me`, plus the signed-in player’s overview.

`/me` is a short page, not a settings dashboard. Signed out: what Steam OpenID does, the link to start, the link to the privacy page. No password field. Signed in: persona, the link to the passport, unlink, and the ephemeral-secret warning only when that warning is true.

The sidebar item «Профиль» goes here when signed out and to the player overview when signed in. It does not become a second home.

There is no settings page full of toggles. Density, language, and theme are not user-facing preferences in this spec. The product is Russian and dark.

## Home

Route: `/`.

Purpose: start a search, and point at the three questions without a phase list.

One title, one sentence, PlayerSearch, the patch-letter versus bucket caption, then three text links in the sidebar’s language: the search itself («Как я играю»), Meta, Duo. They are links, not illustrated cards and not a feature grid of six tiles. Compare is a text link under them.

The home page does not preview a stranger’s stats. It does not show a hero mosaic that implies a tier list.

## Privacy

Route: `/privacy`.

A readable column, 65ch, the three baskets that already exist. No illustration. It stays in the footer of the shell.

## Loading, empty, missing

Unknown hero id: the in-page empty state, not a broken page. Unknown player: the source error, not a header of zeros. A 429 with a cached body shows the cache and the limit caption. A 429 without a cache shows the error and no fake table.
