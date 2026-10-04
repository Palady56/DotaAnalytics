# Component animation spec

Status: specification. The trigger is the only reason the component moves.

Live components are named as they exist. Future components are marked **not built**.

## App shell

`components/AppShell.tsx`

| | |
| --- | --- |
| Purpose | Show which section is current. |
| Trigger | Route change, hover, press. |
| Properties | `background-color`, `color`. A 2px current rule may move with `transform`. |
| Duration | `--motion-fast`, `--ease-standard` |
| Initial | Previous item has the rule. |
| Final | The item for the new path has the rule. |
| Reduced motion | Rule jumps. No slide of the label. |
| Performance | Do not animate the sidebar width. Dragging the resizer stays direct. |
| Do not | `translateX` on hover. That motion is in the CSS today and comes out. |

## Command palette

`components/CommandPalette.tsx`

| | |
| --- | --- |
| Purpose | Confirm the palette opened and which row is selected. |
| Trigger | Ctrl/Cmd+K, Escape, arrow keys, result arrival. |
| Properties | `opacity` on the surface. `background-color` on the selected row. |
| Duration | `--motion-fast` open and close, `--motion-micro` row |
| Initial | Closed, or previous selection. |
| Final | Open at full size, selected row washed. |
| Reduced motion | Open and close are instant. |
| Performance | No scale-from-origin, no blur backdrop animation. |
| Do not | Stagger result rows. Search must feel immediate. The tiny bar mark may stay only while `loading` is true, and it uses transform only. |

## Buttons, links, tabs

`PlayerModes`, filter chips, forms.

| | |
| --- | --- |
| Purpose | The control heard the pointer or the key. |
| Trigger | Hover, press, `aria-current` change. |
| Properties | `background-color`, `color`, `border-color` |
| Duration | `--motion-fast` |
| Reduced motion | Instant color. |
| Do not | Scale, ripple, 3D, a moving underline longer than the tab rule. |

## Stat tile

Profile primary row, Duo lifetime tiles, Compare is not a tile.

| | |
| --- | --- |
| Purpose | Hover says the tile is one fact, not a button that grows. |
| Trigger | Hover only. Not on load. |
| Properties | `background-color`, `border-color`, `transform: translateY(-1px)` |
| Duration | `--motion-fast`, `--ease-standard` |
| Initial | Flat on the surface. |
| Final | One pixel up, slightly stronger edge. |
| Reduced motion | Color only. |
| Do not | Pulse, float, glow, scale, shadow. |

## Profile entrance

`app/players/[accountId]/page.tsx`

| | |
| --- | --- |
| Purpose | Establish who, then the three headline numbers, then the record. |
| Trigger | First paint of that profile. Not on Turbo toggle. Not on scroll. |
| Groups | 1 `.player-stage`. 2 the three `.stat-tile`s together. 3 activity, heroes, matches, patch, lanes, averages, lifetime as one group. |
| Properties | `opacity`, and at most `translateY(4px)` on group 1 |
| Duration | Group 1 `--motion-emphasis`. Groups 2 and 3 `--motion-normal`. Stagger `--motion-stagger`, two gaps only. |
| Reduced motion | All groups visible immediately. |
| Do not | A delay per hero card or per match row. |

Numbers inside the tiles follow `MOTION_TOKENS.md` only when a filter changes them. First paint may show the final figure with no count-up.

## Rank medal

`components/RankMedal.tsx`

| | |
| --- | --- |
| Purpose | None. The medal is a fact. |
| Trigger | No animation. |
| Reduced motion | Unchanged. |
| Do not | Spin the medal, pulse stars, or animate the leaderboard digits. |

## Activity calendar

`components/ActivityCalendar.tsx`

| | |
| --- | --- |
| Purpose | The tooltip says what the cell means. |
| Trigger | Hover a day. |
| Properties | Tooltip `opacity` and `translateY(2px)`. |
| Duration | `--motion-micro` |
| Reduced motion | Tooltip appears in place. |
| Do not | Animate the grid in, or replay cell colors. |

## Match line and roster row

`components/MatchLine.tsx`, match page roster.

| | |
| --- | --- |
| Purpose | Hover marks the row you will open. |
| Trigger | Hover. |
| Properties | `background-color` |
| Duration | `--motion-micro` |
| Reduced motion | Instant. |
| Do not | Slide each row in. Sort/filter position animation waits until the list is client-side. Today the list is server-rendered, so rows appear in place. |

## Meters

Win/loss bars, item meters, lane counts.

| | |
| --- | --- |
| Purpose | Show proportion once, when that dataset arrives. |
| Trigger | First paint of the dataset, or a filter that changes the ratio. |
| Properties | `transform: scaleX` on the fill, origin left. |
| Duration | `--motion-chart`, `--ease-chart` |
| Initial | Scale 0. |
| Final | The true ratio. |
| Reduced motion | Final scale immediately. |
| Do not | Re-run the rise when the user scrolls the same bars back into view. |

## Recent-match bars

Height encodes KDA form, not MMR.

| | |
| --- | --- |
| Purpose | Same as meters: one reveal of this sample. |
| Properties | `transform: scaleY`, origin bottom. |
| Duration | `--motion-chart` |
| Do not | A second animation when Turbo is toggled if the component remounts the same numbers. If the set of matches changes, the new set may reveal once. |

## Home cards

| | |
| --- | --- |
| Purpose | Hover, same rule as stat tiles. |
| Properties | `background-color`, `translateY(-1px)` |
| Do not | The current `-3px` plus shadow. |

## Pair form

`components/PairForm.tsx`

| | |
| --- | --- |
| Purpose | Point at the field that failed. |
| Trigger | Friend code, unknown profile, same player twice. |
| Properties | `border-color`. Optional 2px horizontal nudge on the invalid input only, `--motion-micro`, once. |
| Reduced motion | Border color only. |
| Do not | Shake the page or both fields when one is wrong. |

## Loading stage

`components/LoadingStage.tsx`

| | |
| --- | --- |
| Purpose now | Show that a server read is still open, without hitching. |
| Purpose later | Disappear. Each route’s `loading.tsx` renders a still skeleton of that page and one status line. |
| Trigger | Next.js suspense for that segment. |
| Properties now | `transform` on rings, orbits, and bars. Label does not animate. |
| Reduced motion | Static mark, full label, no loop. |
| Performance | No `filter`, `box-shadow`, dashed borders, or animated `content` on this subtree. It is excluded from the page-enter `rise`. |
| Skeleton later | Profile: header bar, three stat blocks, a chart block. Compare and Duo: two identity blocks and a list block. Match: two roster blocks. Hero and meta: a list block. Status examples: «Загрузка», «Матчи». No fake percent. |

## Logo

`components/Logo.tsx`

No loop. It is the mark in the sidebar and on the home header.
