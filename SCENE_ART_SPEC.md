# 🎨 Scene Art Spec — painted 2.5D backdrops

Everything painterly about the realm comes from these images. The engine handles
parallax, glow, camera and characters — you supply the painted *places*.

## File requirements

| Thing | Value |
|---|---|
| Format | **PNG** (JPG ok if no transparency needed) |
| Size | **4800 × 3000 px** for the one continuous realm map (matches `scenes.ts`; keep the 8:5 ratio if you resize) |
| Save to | `public/scenes/realm.png` |
| Wire up | in `src/data/scenes.ts` set `backdrop: "/scenes/realm.png"` |

The realm is **one big continuous map** — all five spaces painted into a single
image, with the High Keep central and the four guilds around it. The camera pans
and fast-travels across it. The image is far larger than the screen on purpose.
(If 4800×3000 is too big for your generator, make it in sections and stitch, or
shrink the scene `width`/`height` in `scenes.ts` to match your image.)

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
