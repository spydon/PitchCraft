import * as Phaser from "phaser";

export class Plasma extends Phaser.Sprite {
    constructor ({game, x, y}) {
        super(game, x, y, "plasma");

        this.anchor.setTo(0.5);
        this.scale.setTo(0.2);
    }

    update () {
        this.angle += 3;
    }
}

/* export class Plasma extends Phaser.TileSprite {
 *     constructor ({game, x, y}) {
 *         super(game, x, y, 32, 32, "plasma");
 *
 *         this.animations.add("animate");
 *         this.animations.play("animate", 6, true);
 *     }
 * }*/
