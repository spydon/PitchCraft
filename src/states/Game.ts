import * as Phaser from "phaser";
import {Fighter} from "sprites/Fighter";
import {Sky, Background, Foreground} from "sprites/Background";
import {setResponsiveWidth} from "utils";

export class GameState extends Phaser.State {
    fighter: Fighter;

    create () {
        this.game.time.advancedTiming = true;

        this.fighter = new Fighter({
            game: this.game,
            x: this.game.world.centerX,
            y: this.game.world.centerY
        });

        setResponsiveWidth(this.fighter, 30, this.game.world);
        this.game.add.existing(new Sky({game: this.game}));
        this.game.add.existing(new Background({game: this.game}));
        this.game.add.existing(new Foreground({game: this.game}));
        this.game.add.existing(this.fighter);
    }

    render () {
        if (process.env.NODE_ENV === "development") {
            this.game.debug.text(this.game.time.fps.toString(), 2, 14);
            this.game.debug.spriteInfo(this.fighter, 32, 32);
        }
    }
}
