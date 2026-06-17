# Sprite Size Specs — for an image generator

Hand these numbers to your generator. Style is yours to prompt; this is just the geometry the engine needs.

## Sheet geometry (every character, identical)
- **Output:** PNG, **transparent background**, no baked drop shadow.
- **Sheet size:** **288 × 192 px**
- **Grid:** **6 columns × 4 rows**, **48 × 48 px per cell** (288 = 6×48, 192 = 4×48)
- **Character size in cell:** ~**32 px tall**, **horizontally centred**, **feet on the bottom baseline** (~4 px gap at bottom, ~8 px clear at top for a floating quest marker).
- **Consistency rule:** the character must sit at the **same position and proportion in all 24 cells** — no drifting, no zoom changes between frames. This matters more than detail.

## Rows (top → bottom) = facing direction
| Row | Facing |
|-----|--------|
| 0 | **Down** (facing camera) |
| 1 | **Left** |
| 2 | **Right** |
| 3 | **Up** (back turned) |

> Row 2 (Right) can be a mirror of Row 1 (Left) — fine to generate Left only and flip.

## Columns (left → right) = animation frame
| Col | Frame |
|-----|-------|
| 0 | Idle (standing) |
| 1 | Walk — contact (left foot fwd) |
| 2 | Walk — passing |
| 3 | Walk — contact (right foot fwd) |
| 4 | Walk — passing (alt) |
| 5 | Work / action pose (holds their item up) |

## Files (name exactly this) → `/public/sprites/`
| File | Character | Who they are (inspiration) | Held item |
|------|-----------|----------------------------|-----------|
| `elder.png`    | Maeve the Elder       | hooded owl-sage, High Council | staff with a glowing tip |
| `brannock.png` | Brannock Quillfeather | sly fox merchant | coin pouch |
| `tasha.png`    | Tasha Coppernick      | raccoon tinkerer/artificer, goggles | wrench / tool |
| `edmund.png`   | Magister Edmund Vell  | stern badger clerk | ledger book + quill |
| `wren.png`     | Wren Hollowmoor       | warm hedgehog warden | lantern + ring of keys |
| `lyra.png`     | Lyra Pageturner       | curious deer scholar, spectacles | glowing tome |

## Practical notes for image generators (honest)
- Most generators **won't** produce a clean 6×4 grid at exact 48 px on the first try. Two reliable workarounds:
  1. Generate **one big single pose** per character (e.g. a front-facing full body), then downscale + place on the grid yourself / with a tool.
  2. Or generate **one direction strip at a time** (6 frames in a row = 288 × 48) and stack the 4 rows.
- Always state **"transparent background"** explicitly, or you'll get a coloured backdrop you have to key out.
- Tell it to **keep the feet on a fixed baseline** across frames, or the walk cycle will jitter.
- Final files must end up **exactly 288 × 192**, transparent, named as above. The engine assumes that grid — if the dimensions are off, sprites won't slice correctly.
