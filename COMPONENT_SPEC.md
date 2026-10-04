# Component specification

Status: specification only. Components below are not built in this phase. Names are the design-system names. Existing React files are not renamed and not restyled here.

Shared rules, so they are not repeated under every component:

- Keyboard: every control is reachable in tab order. Menus and the palette close on Escape and return focus to the opener.
- Contrast: primary and secondary text meet 4.5:1 on their surface. Muted text is not used for the only copy of a fact.
- Name: icon-only buttons have an accessible name in Russian.
- Motion and tokens: `DESIGN_SYSTEM.md`.
- Density: data components are compact (14px UI type, 8–12px padding). Marketing-scale type is not used inside them.

## AppShell

Purpose: the frame around every page.
Visual role: canvas, sidebar, top bar, main, and on small screens a bottom bar.
Density: the frame is quieter than the page. It does not repeat the page title in a giant header and again in the content.
States: sidebar expanded, collapsed, hidden, overlay (tablet). Bottom bar only under 760px.
Responsive: see `DESIGN_DIRECTION.md`.
Interaction: collapsing the sidebar is a button at the bottom of the sidebar, and it persists locally. It does not animate the page layout for longer than 160ms.
Accessibility: the sidebar is a `nav` with a label «Разделы». The bottom bar is the same list, not a second set of links with different names. Current page is `aria-current="page"`.

## Sidebar

Purpose: destinations.
Visual role: `surface` column, brass rule on the current item.
Density: 32px rows, 16px icon, 14px label. Collapsed: icon only.
States: default, hover, current, collapsed.
Responsive: overlay on tablet, absent on mobile.
Interaction: no nested accordions. Six items do not need a tree.
Accessibility: collapsed items expose their name in a tooltip that is also the accessible name.

## TopBar

Purpose: scope and page modes.
Visual role: 48px, bottom hairline, no shadow. Left: scope (player name or section). Right: search affordance if the sidebar is hidden, and profile.
Density: 14px. The player name here is not the display size. Display size lives in PlayerHeader.
States: with tabs, without tabs.
Responsive: on mobile it keeps search and profile. Tabs scroll underneath.
Interaction: tabs are links, so they can be opened in a new tab.
Accessibility: tabs are a `nav` labeled by the page, not a tab widget that hides the other pages from the URL. The current mode is `aria-current`.

## PlayerSearch

Purpose: the field on the home page and the input inside the palette. It is not a third search behavior.
Visual role: `radius-1` field, 1px border, cream placeholder in muted type.
Density: 40px tall on mobile, 36px on desktop.
States: empty, filled, invalid, submitting.
Responsive: full width of the main column on the home page. Inside the palette it is the first row and has no separate submit button. Enter runs the command.
Interaction: the same query rules as today. A nick and a hero name do not auto-open the first hit. Friend Code still fails with the existing explanation.
Accessibility: label «Найти игрока, героя или матч». Errors are tied to the field with `aria-describedby`.

## CommandPalette

Purpose: `Ctrl`/`Cmd`+`K` reach.
Visual role: `surface-elevated`, `radius-2`, strong border, the one allowed shadow. Groups have a 12px caption.
Density: 36px rows. Portrait 24px. Metadata in muted type on the same row.
States: closed, open, loading hits, empty, one group failed (hero catalog failed does not hide player hits, and the reverse).
Responsive: on mobile it is a full-width sheet under the top bar, not a tiny centered card.
Interaction: arrow keys move the row. Enter runs the default command. A secondary key (`Ctrl`/`Cmd`+`Enter` or a visible action list) runs the other commands listed in the direction. Recent players are local to the browser.
Accessibility: `role="dialog"`, labeled «Поиск», focus trapped, first item selected. Results announce the group («Герои», «Игроки») so a shared name is not ambiguous.

## PlayerHeader

Purpose: who this player is, and the two records that must not be merged.
Visual role: one band. Portrait 72px desktop, 56px mobile, `radius-1`. Name at display size. Account id in mono, muted. Medal text beside the name, not a huge badge.
Density: three figures to the right on desktop — significant record, patch-bucket record, last-20 form. Each figure has a 12px caption naming the window.
States: loading (band stays, figures read «…»), partial (a failed figure is its error caption, the others remain), no medal (the medal slot is omitted), owner (a quiet «это вы» caption and the refresh action).
Responsive: stack portrait and name, then a horizontal row of the three figures.
Interaction: the Steam link is a text link, not a button shaped like a badge. Refresh is the owner action already specified by the product, with the cooldown visible as a caption, not a timer animation.
Accessibility: the two records are not both named «винрейт». Captions are in the accessible name of each figure.

## Stat

Purpose: one number and its window. This replaces the idea of a “stat card.”
Visual role: not a card. No fill, no shadow, no radius. The number is 22px, weight 560. The caption is 12px above it. A second line under the number is the sample or the count.
Density: as tight as the caption allows. Stats in a row share a hairline between them, not a gap that looks like a card grid.
States: value, empty («нет данных»), error (the caption is the error, the number is absent).
Responsive: a row of three may become a row that scrolls. It does not become six stacked cards.
Interaction: none, unless the whole stat is a link to the section it summarizes. If it is a link, it has a hover surface and an accessible name that includes the caption.
Accessibility: the number is not color-only. Win rate that is a judgment also has the sample caption.

## HeroRow

Purpose: one hero in a list, a meta table, or a matchup table.
Visual role: 24×36 portrait (or the source image cropped with `object-fit: cover`), name, then the numbers. Portrait is the color. The row background is transparent until hover.
Density: 36–40px. Secondary stats can sit on the row on desktop and wrap under the name on mobile.
States: default, hover, current hero, thin sample (caption, not a tinted row).
Responsive: the row is the card. Do not build a separate HeroCard that duplicates it. A grid of heroes, if used on the home mosaic or a pool, is HeroRow’s portrait at 48px with the name under it, still without a bordered card.
Interaction: the row or the name is a link to the hero. Meta slice and player query stay in the URL when the page already has them.
Accessibility: the portrait is decorative if the name is text. The link name is the hero name plus the rate and the games, so a screen-reader user does not hear a row of unlabeled numbers.

## DataTable

Purpose: Heroes, meta, matchups, matches on desktop.
Visual role: hairline rows, caption header in muted 12px, no zebra, no outer card. Numeric columns align right and use tabular figures.
Density: 36px rows. Header sticks within the table’s scroll parent, not the window, so the app bar stays put.
States: loaded, empty sentence, error sentence, truncated (a caption, not a silent cut).
Responsive: under 760px, tables that are “a person and a few numbers” become stacked rows using the existing `data-label` idea. Scoreboards stay tables inside a horizontal scroller, with a caption that says the row continues sideways.
Interaction: sortable columns only when the sort is a real mode the page already has. Do not add client sorts that hide the source order without saying so.
Accessibility: `<th>` with scope. Sort state in the button name.

## MatchRow

Purpose: one match in a history.
Visual role: result mark W or L in success or loss, then hero portrait, then KDA, then duration and mode in muted type, then the time as the link.
Density: one line on desktop, two on mobile (result, hero, KDA on the first; mode and time on the second).
States: win, loss, unknown result, unparsed (a muted caption «реплей не разобран», not a disabled row).
Responsive: as above.
Interaction: the time links to the match. The hero links to the hero only if that does not steal the row’s primary link. Primary link is the match.
Accessibility: the result is text, not only color.

## FilterBar

Purpose: the controls that change a slice.
Visual role: a single wrapping row of compact fields, 1px borders, `radius-1`. The active slice is also written as a sentence above the table, so the filter is not the only place the window is named.
Density: 32px controls, 12px labels above them.
States: default, changed and not yet applied if the form submits, disabled while the list is refetching (fields stay editable; a caption says the list is old).
Responsive: on mobile, filters sit in a disclosure closed by default only after the first result is visible. The first visit shows the filters that define the default slice, in one line, with «ещё» for the rest. Hiding every filter behind a button on first paint repeats the OP.GG mobile miss.
Interaction: empty fields are not sent, as the match form already does.
Accessibility: each control has a visible label. The disclosure button states whether filters are expanded.

## DateRangePicker

Purpose: a range, only where the API actually has a date filter.
Visual role: two fields or a single “last N days” choice that maps to the existing `date` parameter. Not a calendar illustration.
Density: same as FilterBar.
States: empty means “no date filter,” which must be labeled, not rendered as “all time” if the source default is different.
Responsive: stacked fields.
Interaction: choosing a range does not pretend to be a patch filter.
Accessibility: start and end have names. An inverted range is an error on the field.

## PatchSelector

Purpose: pick an OpenDota patch bucket where a page already filters by patch id.
Visual role: a select whose option text is the bucket name. The official letter is not an option. A caption beside the control reads the current letter and says the letter does not split the bucket.
Density: one control.
States: buckets unavailable (the caption says so, the control is absent).
Responsive: full width on mobile.
Interaction: changing it refetches that page’s patch-scoped data only.
Accessibility: the caption is associated with the control.

## Chart

Purpose: a series we actually have.
Visual role: on the surface, no tile, no blue fill. A 1.5px line, a legend under the title, the window in the title’s caption. Axes in muted type. No grid, or one baseline gridline.
Density: 160px tall on a player page, 200px if it is the point of the page. Taller charts are Grafana.
States: fewer than two points — the chart is not drawn; the caption says the series is too short. This matches the current sparkline rule.
Responsive: the chart fills the content width. Labels that collide are dropped before the line is.
Interaction: a point may show a tooltip with the value and the index. No zoom, no brush, until a page has a real time domain.
Accessibility: the caption and a text alternative list the values, or the chart is `aria-hidden` and the table beside it is the accessible form. A chart is never the only copy of a number.

## WinRate

Purpose: a percentage that cannot be separated from n.
Visual role: the percent in UI type, the games count in caption type on the same line. Color is success or loss only when the page is a judgment and the sample is past the threshold. Otherwise the percent is secondary type.
Density: inline.
States: thin, enough, crosses, unknown.
Responsive: wraps under the name rather than overflowing.
Interaction: none.
Accessibility: the accessible string includes percent, wins, games, and the sample word.

## RankBadge

Purpose: the medal from `rank_tier`, plus leaderboard rank when present.
Visual role: text, with a small medal mark if one can be drawn without copying official art. «Immortal» and a leaderboard number are type, not a glowing frame.
Density: inline beside the name.
States: absent. There is no placeholder badge.
Responsive: wraps under the name.
Interaction: none. It does not link to a leaderboard we do not have.
Accessibility: the name includes the medal words, not only an image.

## RoleBadge

Purpose: a lane role, or a mode, or a lobby. One component, three captions, so we do not grow a badge for every noun.
Visual role: muted text, optional 1px border, `radius-1`. Not a colored pill per role.
Density: 12px type, 4px vertical padding.
States: unknown role is the word «неизвестно», not a blank badge.
Responsive: wrap.
Interaction: in a filter, the badge’s control is a radio or a link, and the current one uses the brass rule.
Accessibility: the group has a name («Линии», «Режим»).

## SynergySummary

Purpose: the Duo numbers that must show uncertainty.
Visual role: the games count is the largest figure. Observed rate, expected rate, and delta are a row of Stats. The score is caption-sized unless the status is above or below. A status line under the row is always present: «вывода нет», «выше ожидания», or «ниже ожидания», using the words the logic already uses.
Density: the block is one section, not three cards.
States: no shared games, truncated window, peers-only rough summary, score supported.
Responsive: the two players stack, the figures stay one row if they fit, otherwise two.
Interaction: links to the shared match list and to Compare.
Accessibility: the status is text. A muted score is still read with the status, so a screen reader does not announce a precise conclusion the eye was told to ignore.

## ComparisonPanel

Purpose: two passports side by side.
Visual role: two columns, hairline between, each a PlayerHeader at compact size. No merged score. A line under the columns links to Duo and says the comparison is not a synergy score.
Density: compact headers.
States: one side failed, both empty, same id (the existing error).
Responsive: stack, with the names sticky enough that the reader knows which column scrolled. On mobile, each player is a full-width band, not a crushed two-column table.
Interaction: each name links to that passport.
Accessibility: columns are labeled with the player names.

## EmptyState

Purpose: a true empty, not a failed request.
Visual role: one sentence in secondary type, no illustration, no mascot.
Density: 16px of space above and below.
States: the sentence is specific («В этом срезе 0 пиков», «Совпадений нет», «Здесь пусто»).
Responsive: full width.
Interaction: one link when there is an obvious next step («К мете»).
Accessibility: the sentence is in a paragraph, not only a color.

## LoadingState

Purpose: the page is waiting and has nothing honest to show yet.
Visual role: the shell remains. The block shows the section title and the caption «загрузка». No pulsing skeleton grid of six cards.
Density: the title stays so the layout does not jump when numbers arrive.
States: slow source. After the existing timeout, this becomes ErrorState with «OpenDota не успел ответить.»
Responsive: same.
Interaction: none.
Accessibility: `aria-busy` on the region.

## ErrorState

Purpose: the source failed.
Visual role: warning-colored caption, the server’s Russian message, no retry that hammers a 429. A retry link is acceptable when the failure was a timeout.
Density: one paragraph.
States: 429 with the stale-cache sentence, 500, timeout, catalog miss.
Responsive: full width.
Interaction: does not clear sibling blocks that succeeded.
Accessibility: `role="alert"` for the new failure.

## Tooltip

Purpose: a definition or a collapsed-sidebar name.
Visual role: `surface-elevated`, 12px type, strong border, no shadow.
Density: one or two lines.
States: closed, open.
Responsive: on touch, the same text is in the visible caption. Tooltips are not the only place a definition lives.
Interaction: hover and focus. Not on click-only.
Accessibility: the trigger has `aria-describedby` or the name is on the control itself.

## Modal

Purpose: a destructive or blocking confirmation. Not a place to put statistics.
Visual role: same as the palette, narrower. Title, one paragraph, two actions. Primary action is a filled cream button with `accent-ink` text, used almost nowhere else. Secondary is text.
Density: 16px padding.
States: open, submitting.
Responsive: bottom sheet on mobile, dialog centered on desktop.
Interaction: focus trap, Escape closes if the action is not destructive. Unlink and logout stay explicit.
Accessibility: labeled by the title.

## DateRangePicker, PatchSelector

Specified in the direction of FilterBar. They are not separate visual languages. PatchSelector’s caption always separates the official letter from the bucket. DateRangePicker does not use a patch id, and PatchSelector does not pretend to filter by letter.
