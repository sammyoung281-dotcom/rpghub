# 🎨 Scene Art Spec — painted 2.5D backdrops

Everything painterly about the realm comes from these images. The engine handles
parallax, glow, camera and characters — you supply the painted *places*.

## File requirements

| Thing | Value |
|---|---|
| Format | **PNG** (JPG ok if no transparency needed) |
| Size | **2400 × 1500 px** (matches the default scene; bigger e.g. 3200×2000 is fine — just keep 8:5) |
| Save to | `public/scenes/<id>.png` (e.g. `public/scenes/high-glade.png`) |
| Wire up | in `src/data/scenes.ts` set `backdrop: "/scenes/high-glade.png"` |

The image is **larger than the screen on purpose** — you pan/zoom around it.

## Composition rules (so characters + camera work)

1. **One fixed isometric angle**, consistent across all scenes (camera can't rotate).
2. **Leave open, fairly flat ground areas** (a plaza, clearing, hall floor) where
   characters stand — that's where hotspots get placed.
3. **Do NOT paint in characters, speech bubbles, UI, or text** — the app draws
   those on top. A clean stage.
4. Keep a **consistent light direction** (e.g. sun from upper-right) so added glow
   reads correctly.
5. Detail/atmosphere toward the **edges** (trees, cliffs, foreground framing);
   calmer in the middle where the action is. Matches the reference.

## Copy-paste generation prompt

> Top-down isometric 2.5D fantasy RPG environment, painterly hand-painted game art,
> lush enchanted forest glade with a circular ancient stone plaza in the centre,
> intricate celtic-knot inlaid stone floor, tall sunlit trees with volumetric light
> shafts breaking through the canopy, mossy rocky cliffs with glowing teal crystal
> clusters, glowing blue magical lantern-pillars, scattered wildflowers and ferns,
> warm-and-cool atmospheric lighting, soft mist, rich saturated colours, cosy and
> magical (not grim), high detail, fixed isometric camera angle, NO characters, NO
> text, NO UI, clean empty plaza for actors, 2400x1500.

Tweak the **middle clause** per guild to re-skin the place while keeping the style:

- 🪙 **Merchant's Guild** → "a bustling open-air market plaza with empty stalls,
  awnings, crates, coin motifs, a harbour glimpsed beyond".
- ⚙️ **Order of the Ledger** → "a stately stone counting-hall courtyard, orderly
  pillars, ledgers and brass instruments, cool disciplined light".
- 🛡️ **Hearthkeepers** → "a warm cottage hearth-village green, gardens, washing
  lines, a well, homely and snug".
- 📜 **Scholars' Tower** → "a hilltop observatory courtyard, telescopes, floating
  runes, starlit dusk sky, scrolls and orreries".
- 🏰 **High Keep** → "a grand throne-glade with a raised dais and empty ornate
  throne, banners, the most majestic of all".

## After you drop art in

The procedural placeholder vanishes automatically once `backdrop` is set. Then
nudge each character's `x,y` in `scenes.ts` so they stand in the right spot on the
new art (tip: temporarily show coordinates by clicking around — or just eyeball it).
