import * as Phaser from "phaser";

export class Plasma extends Phaser.Sprite {
    constructor ({game, x, y, asset}) {
        super(game, x, y, asset);

        this.anchor.setTo(0.5);
    }

    update () {
        this.angle += 1;
    }
}
