# Motion performance rules

Status: specification. These rules also explain the loading hitch that had to be removed.

## Compositor only

Animate `transform` and `opacity`. Color and border color are allowed only for micro interactions under 140ms.

Do not animate `width`, `height`, `top`, `left`, `margin`, `padding`, `letter-spacing`, `box-shadow`, or `filter`.

Do not animate the `content` property. Changing it forces style and layout on a timer and hitches every other animation on the page. It also shifts centered text.

## Loading mark

The centered mark was hitching because it mixed compositor motion with paint:

- `filter: blur` on a scaling glow
- `box-shadow` on moving dots
- a rotating dashed border
- an animated `::after` content string after «Загрузка», which reflowed the line and pulled it off center
- the page-enter `rise` transform on the same node as the infinite spins

The stopgap mark uses transform only. The label is a fixed centered line with `letter-spacing: 0`. It is excluded from `rise`.

## Lists

Do not put an entrance delay on `.match-line`, `.hero-tile`, `.duo-match`, or `.roster-row`. A page of thirty delayed rows is both slow and a long style recalc.

Hover on a row is a background color, not a transform, so the row does not promote a new layer per item.

## Charts

Prefer one SVG path and `stroke-dashoffset` over hundreds of DOM nodes. Do not rebuild a chart on scroll. Do not run two reveals on the same node in one frame (page `rise` plus chart draw).

## Shadows and blur

The home card hover shadow comes out. Backdrop blur on the palette, if added, is static, not animated.

## will-change

Only on an element that is animating transform for longer than a hover, and only while that animation runs. The loading rings may keep `will-change: transform` while suspense is showing, because that subtree unmounts when data arrives. Do not set `will-change` on cards and rows.

## Main thread

No scroll listeners that toggle classes on every section. No intersection observers that replay entrances. Number tweens, when implemented, run one timer per visible headline, not one per table cell, unless a filter changed that cell and the tween is under `--motion-fast`.

## Images

Hero portraits and rank medals do not animate. Rank art is a static PNG. Do not cross-fade medal variants on a timer.

## Reduced motion

The global override stays last in the stylesheet so it wins. New motion tokens must still be covered by that override, not by a second system that forgets it.
