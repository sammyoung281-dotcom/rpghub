import { useRealmStore } from "../store/useRealmStore";
import { MOCK_DIALOGUES } from "../data/mockDialogues";
import type { RealmScene } from "../types";

/**
 * Approach a character: glide the camera to them, then open their dialogue.
 * Shared by hotspot clicks and the "Attend ▸" button on the proclamation scroll,
 * so both routes feel identical. Clears any matching "need" once resolved.
 */
export function summonCharacter(scene: RealmScene, characterId: string) {
  const store = useRealmStore.getState();
  const spot = scene.hotspots.find((h) => h.characterId === characterId);
  if (spot) store.focusCamera({ x: spot.x, y: spot.y - 80, zoom: 1.15 });

  const base = MOCK_DIALOGUES[characterId];
  if (!base) return;
  store.openDialogue({
    ...base,
    onResolve: () => store.removeNeed(`need-${characterId}`),
  });
}
