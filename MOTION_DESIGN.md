# Motion design

Status: implemented in the interface. This file remains the source of the motion rules.

The running interface is the cool near-black UI in `app/globals.css`. `DESIGN_SYSTEM.md` still describes an older warm palette and is not the motion source of truth.

Personality: **precision under pressure**. Data comes alive when it changes. The rest of the screen stays still.

## Why something moves

Every animation answers one of these:

- hierarchy: what to read first
- state: hover, current tab, error, empty
- progress: a value is resolving or a request is still open
- relationship: two players, a hero pair, a filter against a baseline
- data change: the number, bar, or line is a different fact than a moment ago
- interaction: the control responded
- navigation: the page changed, without a scene change

If none of those apply, it does not move.

## What exists today

These motions are already in the CSS. They are not the target system. The next implementation pass replaces the ones that fail the modernity check.

| Motion | Where | Problem |
| --- | --- | --- |
| `rise` on `.sheet > *` and on cards, tiles, match rows | Almost every page | Generic entrance. Sections slide up on every visit. |
| `translateY(-3px)` and shadow on `.home-card` | Home | Stronger than a 1px lift. Shadow animates paint. |
| `translateX(3px)` on nav hover | Sidebar | A directional slide that does not explain state. |
| `grow` / `fill` on meters | Win bars, recent-match bars | Acceptable if it runs once, on first paint only. |
| Centered loading mark | `LoadingStage` | Temporary. It is an infinite ornament. Target is a skeleton with a status line. The mark must stay smooth until that replacement. |
| `prefers-reduced-motion` | `globals.css` | Duration forced to 1ms and iteration count to 1. Keep this behavior. |

There is no page transition, no number tween, no chart draw, no shared-element move between Duo and Compare.

## Surfaces that do not exist yet

Do not invent these screens in order to animate them. Specify the motion now so a later build does not improvise.

- Player Evolution and its patch timeline
- A hero-pair matrix
- A “player leads N% of categories” verdict on Compare

Until those exist, Compare is two profiles side by side and Duo is shared matches. Motion for them uses the real layouts.

## Personality by product

| Surface | Feeling | Motion |
| --- | --- | --- |
| Profile | A dataset being read | Header, then the three primary stats, then the rest as one group |
| Compare | Two datasets set next to each other | Both heads together, then rows |
| Duo | Two players connected | Both heads together, then the shared-match facts |
| Hero | A public record, not a guide | Portrait stays still. Lists do not parade in. |
| Meta | A table of the current slice | Slice change updates numbers. The page does not replay. |
| Search | Instant | Palette opens in one short fade. Results do not stagger. |

## Speed

The interface should feel faster than the network. Motion never blocks the next click.

| Token | Range | Use |
| --- | --- | --- |
| Micro | 80–120ms | Color, focus, row highlight |
| Fast | 120–180ms | Hover, tab indicator, tooltip, palette |
| Standard | 180–280ms | Small enter/exit, filter chip |
| Emphasis | 280–450ms | One profile header, one result emphasis |
| Chart | 450–700ms | A line reveal or a bar resolve, once per dataset |

Nothing decorative runs longer than 800ms. A number never counts up from zero.

## What we refuse

- Fade or slide on every section
- Cards scaling from 95% to 100%
- Bounce, elastic, overshoot
- A spinner on every wait
- Parallax, floating loops, particle fields, animated gradients
- Scroll-triggered replay
- Fire, lightning, spell HUD, a fighting-game “VS”
- Glow as a hover language
- Animating `box-shadow`, `filter`, `letter-spacing`, or `content`

## Modernity check

Before any motion is coded, it has to pass all ten:

1. It makes the interface clearer.
2. It makes the interface feel faster.
3. It communicates a state change.
4. It helps the reader understand data.
5. It reinforces precision, not decoration.
6. It still looks current.
7. It is not annoying after half an hour.
8. It is not a generic dashboard flourish.
9. It is not an old game site.
10. Removing it does not hide a fact.

Fail one, and it is cut.

## Loading, until skeletons exist

The centered mark is a stopgap for slow OpenDota reads. It is allowed to loop only while the request is open.

Rules for that stopgap:

- Transform and opacity only. No blur, no shadow, no dashed borders, no animated `content`.
- The status word is a fixed centered line. It does not grow dots, tracking, or width.
- The mark is not also running the page-enter `rise`.
- Copy names the wait when we know it: «Загрузка», «Матчи». Do not invent a progress percent.

The replacement is specified in `COMPONENT_ANIMATION_SPEC.md` and `PAGE_TRANSITION_SPEC.md`: a still skeleton of the page that is about to appear, plus one status line.
