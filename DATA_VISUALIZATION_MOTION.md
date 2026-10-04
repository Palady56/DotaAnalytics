# Data visualization motion

Status: specification. Charts in the app today draw at full length on first paint.

## Rules for every chart

- Animate when the dataset identity changes: first load, other player, other hero, other patch slice, other match.
- Do not animate because the chart scrolled into view.
- Do not destroy the node and mount a new one if the series can be updated in place.
- One reveal per change. Duration `--motion-chart`, easing `--ease-chart`.
- Reduced motion: paint the final geometry.
- Keep the honest limits already in the product. Motion does not invent MMR, a party, or a position 1–5.

## Sparkline

`components/Sparkline.tsx`. A short form line, 72×22.

| | |
| --- | --- |
| Trigger | The points array identity changes. |
| Motion | Stroke reveals from left to right with `stroke-dashoffset`. |
| Initial | Dash offset equal to path length. |
| Final | Offset 0. |
| Do not | Fill under the line. Do not redraw on hover. |

## Advantage chart

`components/AdvantageChart.tsx` on the match page. Gold or XP advantage over time.

| | |
| --- | --- |
| Trigger | Match page load. |
| Motion | The line draws once. The area opacity follows from 0 to 0.2. No gradient animation. |
| Do not | A playhead that runs the match on a loop. |

## Activity

The calendar is a grid of discrete days, not a chart to morph. Cells do not animate in. The tooltip is specified on the component.

## Win, item, and lane meters

Specified as scale transforms in `COMPONENT_ANIMATION_SPEC.md`. When a filter replaces the ratio, scale from the old ratio to the new one (`--ease-data`, `--motion-number`). Do not snap back to zero first.

## Hero list and meta

`app/meta/page.tsx`, `app/heroes/[heroId]/page.tsx`.

Changing Топ / Частые / Все, or the rank slice, replaces rows on the server today. Until that list is client-updated, rows appear in place with no stagger.

When a later client filter exists:

- Shared heroes stay mounted and move with a layout animation if the library supports it without measuring every frame by hand.
- Win rate text tweens from old to new.
- Rows that leave fade with `--ease-exit` in `--motion-fast`.
- Do not slide the whole page.

## Compare

`app/compare/page.tsx`.

| | |
| --- | --- |
| Trigger | Both profiles resolve, or the pair changes. |
| Heads | Both identity cards at once. No left-versus-right fight. |
| Rows | Delta numbers tween if the same row label existed for the previous pair. Otherwise they appear final. |
| Bars | Scale from 0 once for a new pair. From old scale to new scale if the row persists. |
| Result line | There is no “leads N% of categories” verdict. Do not add one for the sake of a count-up. |
| Do not | A VS slam, screen shake, or a glow on the higher side. A higher win rate may use the existing outcome color when the sample rule already allows it. |

## Duo

`app/duo/[a]/[b]/page.tsx`.

| | |
| --- | --- |
| Trigger | The pair’s report arrives. |
| Connection | Optional 1px rule between the two heads, opacity 0 to 1 in `--motion-normal`. No lightning, no node that pulses. |
| Score | Synergy, when shown, tweens from the previous pair’s score or appears final on first load. It does not count from 0. |
| Matches | The shared list appears in place. |
| Do not | A matrix hover model. There is no hero-pair matrix. The pair lines that exist highlight on hover with a row wash only. |

## Player Evolution

**Not built.** When it exists:

- Changing the window (previous 20 / last 20) morphs the same chart between the two series. The line does not unmount.
- Win rate, hero count, and role share tween from the previous window’s values.
- The patch timeline is a still axis. Selecting a point emphasizes that point with color and a 2px scale on the dot only, then the bound stats and chart transition. No flash.
- Scroll does not replay the timeline.

## Hero artwork

Portraits on profile, match, and hero pages stay still. A later hover may shift the image by at most 2px inside an overflow mask. No zoom that crops the face, no light sweep, no readability loss on the name.
