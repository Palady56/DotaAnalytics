# Motion tokens

Status: specification. The live sheet only has `--motion-fast: 120ms`, `--motion-base: 160ms`, and `--ease`. Do not add the rest until an implementation pass.

Durations are ceilings. A control may be shorter. It may not invent a longer time.

## Duration

| Token | Value | Use |
| --- | --- | --- |
| `--motion-micro` | 100ms | Focus ring, row wash, badge color |
| `--motion-fast` | 140ms | Button, link, tab color, palette fade |
| `--motion-normal` | 220ms | Chip, dropdown, small block enter/exit |
| `--motion-emphasis` | 360ms | Profile header only |
| `--motion-chart` | 560ms | One chart or one meter group per dataset |
| `--motion-number` | 420ms | A metric that changed |
| `--motion-stagger` | 40ms | Gap inside one coordinated group. Max 3 steps. |

Hover uses `--motion-fast`. Tooltip uses `--motion-micro` in, `--motion-fast` out. Palette uses `--motion-fast`. There is no modal duration until a modal exists. Page swap uses `--motion-normal` on opacity only.

## Easing

One curve does not serve every job.

| Token | Curve | Use |
| --- | --- | --- |
| `--ease-enter` | `cubic-bezier(0.2, 0, 0, 1)` | Something arriving |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Something leaving |
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Hover, tabs, buttons. Fast ease-out. |
| `--ease-data` | `cubic-bezier(0.4, 0, 0.2, 1)` | Numbers and bars between two real values |
| `--ease-chart` | `cubic-bezier(0.33, 0, 0.2, 1)` | Line reveal, meter resolve |

No bounce. No elastic. `--ease` in the current CSS may stay as the alias of `--ease-standard` when tokens are added.

## Property allowlist

| Allowed | Only when |
| --- | --- |
| `transform` | Position, scale of a bar, a moving tab rule |
| `opacity` | Enter, exit, tooltip, unavailable state |
| `color`, `background-color`, `border-color` | Micro interactions under 140ms |
| SVG `stroke-dashoffset` | One chart draw per dataset |

Not allowed as animated properties: `width`, `height`, `top`, `left`, `margin`, `letter-spacing`, `box-shadow`, `filter`, `content`.

## Stagger

A stagger is a sequence, not a cascade down the page.

- Profile: header `0`, primary stat row `40ms`, everything else together at `80ms`.
- Compare and Duo: both identities `0`, the board `40ms`.
- Lists, hero grids, match rows: no per-item delay.

## Number transition

- Duration `--motion-number` for a headline rate, `--motion-fast` for a table cell.
- Interpolate from the previous value to the next value.
- Do not start at 0 unless the previous value was 0.
- Use tabular figures so digits do not reflow.
- Win-rate color changes with `--motion-micro` only when the sample is large enough to carry an outcome color. Thin samples stay secondary type and do not flash green or red.

## Reduced motion

Under `prefers-reduced-motion: reduce`, every token duration used for movement becomes `0ms`. Color changes may stay at `--motion-micro`. Charts and numbers appear at their final value.
