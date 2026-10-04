# Page transition spec

Status: specification. Navigation is instant. The shell does not move.

## Routes

| Path | Role |
| --- | --- |
| `/` | Home |
| `/search` | Lookup result |
| `/matches`, `/matches/[matchId]` | Public match list and one match |
| `/meta`, `/heroes/[heroId]` | Hero index and one hero |
| `/duo`, `/duo/[a]/[b]` | Duo form and one pair |
| `/compare` | Two profiles |
| `/players/[accountId]` | Profile |
| `/players/[accountId]/matches` | That player’s matches |
| `/players/[accountId]/meta` | That player’s patch heroes |
| `/me` | Sign-in or the signed-in profile |
| `/privacy` | Static |

There is no Evolution route.

## Transition

On a client navigation:

1. Outgoing page opacity to 0 in `--motion-fast` with `--ease-exit`, only if the incoming page is not ready in that same frame.
2. Incoming page opacity to 1 in `--motion-normal` with `--ease-enter`.
3. Movement is at most `translateY(4px)` on the incoming page root. Never a horizontal slide. Never more than a few pixels.

If the next page is ready immediately, skip the outgoing fade and paint it.

The sidebar, top bar, and current-section rule stay mounted. `PlayerModes` swaps the current tab with the tab rule only.

## Per route

| From → to | Extra motion |
| --- | --- |
| Anywhere → profile | Profile entrance groups in `COMPONENT_ANIMATION_SPEC.md`. |
| Profile → matches, hero index, own meta | No second entrance. The mode tab moves. Content fades in `--motion-fast` if anything. |
| Duo form → pair, or Compare with new ids | Loading skeleton, then the pair entrance. |
| Compare ↔ Duo for the same two ids | No shared-element flight. A text link is enough. Optional later: the two avatars may cross-fade if both pages are client-side. Not required. |
| Meta slice or hero | Server navigation today. No full-page replay. |
| Palette → a result | Palette closes in `--motion-fast`. The destination uses its normal entrance once. |

## Loading

`loading.tsx` files currently mount `LoadingStage`. That mark is a stopgap and must not hitch.

Next implementation of those files:

| File | Skeleton | Status line |
| --- | --- | --- |
| `app/loading.tsx` | None. A single status line centered. | «Загрузка» |
| `app/players/[accountId]/loading.tsx` | Header, three stats, one block | «Загрузка» |
| `app/players/[accountId]/matches/loading.tsx` | List rows | «Матчи» |
| `app/players/[accountId]/meta/loading.tsx` | Hero row blocks | «Загрузка» |
| `app/compare/loading.tsx` | Two heads, row lines | «Загрузка» |
| `app/duo/[a]/[b]/loading.tsx` | Two heads, one list | «Загрузка» |
| `app/matches/[matchId]/loading.tsx` | Two roster blocks | «Загрузка» |
| `app/heroes/[heroId]/loading.tsx` | Title and list rows | «Загрузка» |
| `app/meta/loading.tsx` | List rows | «Загрузка» |

Skeletons are still. They do not shimmer in a loop. A single status line under the skeleton is allowed. No percent, no fake progress.

## Filter changes

Turbo on the profile, rank slice on meta, and the pair form are navigations or server renders today. They must not replay the profile entrance. When a control can change data without a document navigation, only the affected numbers and charts transition (`DATA_VISUALIZATION_MOTION.md`).

## Reduced motion

Page opacity jumps. Skeletons still occupy the same boxes so layout does not jump.
