import * as Phaser from "phaser";

export class Fighter extends Phaser.Sprite {
    constructor ({game, x, y}) {
        super(game, x, y, "fighter");

        this.anchor.setTo(0.5);
    }

    update () { }
}
