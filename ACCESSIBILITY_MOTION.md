# Accessibility and motion

Status: specification, plus the behavior already enforced at the bottom of `app/globals.css`.

## Requirement

`prefers-reduced-motion: reduce` turns movement off. The product stays readable and operable.

Already in CSS: animation duration 1ms, iteration count 1, transition duration 1ms. Keep that as the backstop so a new animation cannot loop forever for someone who asked for less motion.

## What remains

- Focus rings
- Color of the current nav item, tab, win, and loss
- Tooltips, opened by hover or focus, without a travel distance
- The status text in a loading state («Загрузка», «Матчи»)
- Final chart geometry and final numbers
- Error text on the field that failed

## What stops

- `rise` on sections, cards, and rows
- Bar and line reveals
- Number tweens
- The loading mark’s rotation and bar loop
- Tab-rule travel
- Any future parallax, hero-art shift, or timeline pulse
- The 2px error nudge

## Not a substitute

Reduced motion is not a hidden mode that removes facts. A thin sample still says «мало игр». A failed block still says it failed. A skeleton still has its status line.

## Vestibular and attention

No full-page slide, no zoom, no flashing opacity faster than a single fade, no infinite motion on a page the reader is meant to study. The only infinite motion allowed in the current UI is the loading mark, and it runs only during suspense. Reduced motion stops that too.

## Keyboard

Palette arrow keys move the selected row immediately under reduced motion. The selected row still has a wash so the position is visible without relying on animation.

## Copy

Do not convey state by motion alone. The current section has a label and `aria-current`. Loading has `role="status"` and a visible word. Charts that are meaningful have a text alternative already (`aria-label` on the advantage chart). New charts follow that.
