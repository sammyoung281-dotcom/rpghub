import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { WorldScene } from "./scenes/WorldScene";

/**
 * Mounts the Phaser game into a div and tears it down on unmount.
 * Phaser owns the canvas; React UI overlays sit on top (added in later steps).
 */
export default function PhaserGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!hostRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      backgroundColor: "#1a140d",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      pixelArt: true,
      physics: {
        default: "arcade",
        arcade: { gravity: { x: 0, y: 0 }, debug: false },
      },
      scene: [WorldScene],
    });

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return <div id="game-root" ref={hostRef} />;
}
