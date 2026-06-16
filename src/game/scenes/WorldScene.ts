import Phaser from "phaser";

/**
 * STEP 1 scene: a single walkable room.
 * Everything here is drawn from generated textures (colored tiles) so the app
 * runs with zero external art. Swap these for real Kenney.nl tiles in Phase 1.5
 * by replacing the makeTextures() body and pointing sprites at the loaded keys.
 */

const TILE = 32;
const ROOM_COLS = 26;
const ROOM_ROWS = 18;
const SPEED = 180;

export class WorldScene extends Phaser.Scene {
  private hero!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super("WorldScene");
  }

  preload() {
    this.makeTextures();
  }

  create() {
    const worldW = ROOM_COLS * TILE;
    const worldH = ROOM_ROWS * TILE;

    // --- floor (stone) ---
    for (let y = 0; y < ROOM_ROWS; y++) {
      for (let x = 0; x < ROOM_COLS; x++) {
        const key = (x + y) % 2 === 0 ? "floor-a" : "floor-b";
        this.add.image(x * TILE, y * TILE, key).setOrigin(0);
      }
    }

    // --- walls around the edge ---
    this.walls = this.physics.add.staticGroup();
    for (let x = 0; x < ROOM_COLS; x++) {
      this.addWall(x, 0);
      this.addWall(x, ROOM_ROWS - 1);
    }
    for (let y = 0; y < ROOM_ROWS; y++) {
      this.addWall(0, y);
      this.addWall(ROOM_COLS - 1, y);
    }

    // a couple of decorative pillars so movement/collision is visible
    this.addWall(8, 6);
    this.addWall(8, 11);
    this.addWall(17, 6);
    this.addWall(17, 11);

    // a rug to mark the throne spot (purely cosmetic, hints at the Keep)
    this.add.rectangle(worldW / 2, worldH / 2, TILE * 5, TILE * 4, 0x6b2f8c, 0.35).setOrigin(0.5);

    // --- hero ---
    this.hero = this.physics.add.sprite(worldW / 2, worldH / 2 + TILE * 3, "hero");
    this.hero.setCollideWorldBounds(true);
    (this.hero.body as Phaser.Physics.Arcade.Body).setSize(20, 20).setOffset(6, 10);
    this.physics.add.collider(this.hero, this.walls);

    // a floating name tag so it reads as a character
    const tag = this.add
      .text(0, 0, "The Sovereign", {
        fontFamily: "Trebuchet MS, sans-serif",
        fontSize: "13px",
        color: "#f4e9cf",
        backgroundColor: "#3a2a18cc",
        padding: { x: 5, y: 2 },
      })
      .setOrigin(0.5, 1)
      .setDepth(10);
    this.events.on("update", () => tag.setPosition(this.hero.x, this.hero.y - 22));

    // --- camera ---
    this.physics.world.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.startFollow(this.hero, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor("#1a140d");

    // --- input ---
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  }

  update() {
    if (!this.hero) return;
    const body = this.hero.body as Phaser.Physics.Arcade.Body;
    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.left.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy += 1;

    const len = Math.hypot(vx, vy) || 1;
    body.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);
  }

  private addWall(col: number, row: number) {
    const w = this.add.image(col * TILE, row * TILE, "wall").setOrigin(0);
    this.walls.add(w);
    const body = (w as unknown as Phaser.GameObjects.GameObject & {
      body: Phaser.Physics.Arcade.StaticBody;
    }).body;
    body.setSize(TILE, TILE).setOffset(0, 0);
  }

  /** Generate all placeholder textures procedurally. */
  private makeTextures() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    const tile = (key: string, fill: number, border: number) => {
      g.clear();
      g.fillStyle(fill, 1).fillRect(0, 0, TILE, TILE);
      g.lineStyle(1, border, 0.6).strokeRect(0.5, 0.5, TILE - 1, TILE - 1);
      g.generateTexture(key, TILE, TILE);
    };

    tile("floor-a", 0x4b5a3a, 0x3c4a2e); // mossy stone
    tile("floor-b", 0x53623f, 0x3c4a2e);
    tile("wall", 0x6d5a3a, 0x4a3c24); // timber/stone wall

    // hero: a little cloaked figure
    g.clear();
    g.fillStyle(0x2c4a7a, 1).fillRoundedRect(6, 10, 20, 20, 5); // cloak
    g.fillStyle(0xe8c79a, 1).fillCircle(16, 10, 7); // head
    g.fillStyle(0xc9a24b, 1).fillRect(6, 8, 20, 3); // gold trim
    g.generateTexture("hero", TILE, TILE);

    g.destroy();
  }
}
