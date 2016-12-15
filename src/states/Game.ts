import * as Phaser from "phaser";
import {Fighter} from "sprites/Fighter";
import {Plasma} from "sprites/Plasma";
import {PitchDetect} from "audio/PitchDetect";
import {Sky, Background, Foreground} from "sprites/Background";
import {setResponsiveWidth} from "utils";

export class GameState extends Phaser.State {
    fighter: Fighter;
    plasmas: Phaser.Group;
    background;
    pitchDetect: PitchDetect;

    create () {
        this.pitchDetect = new PitchDetect();
        if (process.env.NODE_ENV === "development") {
            this.game.time.advancedTiming = true;
        }

        this.fighter = new Fighter({game: this.game, x: 120, y: this.game.world.centerY});

        this.background = {
            sky: new Sky({game: this.game}),
            background: new Background({game: this.game}),
            foreground: new Foreground({game: this.game})
        };
        this.game.add.existing(this.background.sky);
        this.game.add.existing(this.background.background);
        this.game.add.existing(this.background.foreground);

        this.plasmas = this.game.add.group();
        this.plasmas.createMultiple(30, "plasma");
        this.plasmas.setAll("anchor.x", 0.5);
        this.plasmas.setAll("anchor.y", 0.5);
        this.plasmas.setAll("outOfBoundsKill", true);
        this.plasmas.setAll("checkWorldBounds", true);

        this.game.add.existing(this.plasmas);
        this.game.add.existing(this.fighter);

        this.game.onBlur.add(() => console.log("BLURRED"));
        this.game.onFocus.add(() => console.log("FOCUSED"));
    }

    update() {
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.fighter.updateRotation("up");
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
            this.fighter.updateRotation("down");
        } else {
            this.fighter.updateRotation();
        }

        if (Math.random() < 0.01) {
            this.createPlasma();
        }
    }

    createPlasma () {
        let plasma = this.plasmas.getFirstExists(false);
        if (plasma) {
            plasma.destY = null;
            plasma.reset(process.env.WIDTH + plasma.width / 2 - 1, process.env.HEIGHT * Math.random());
            plasma.scale.setTo(0.2);
            plasma.update = () => {
                plasma.angle += 5;
                plasma.x -= 2;
                if (plasma.x < process.env.WIDTH - 300 && !plasma.destY) {
                    plasma.destY = this.pitchDetect.getY(process.env.HEIGHT - plasma.height) + plasma.height / 2;
                    console.log(plasma.destY);
                } else if (plasma.destY && (plasma.y < plasma.destY - 10 || plasma.y > plasma.destY + 10)) {
                    plasma.y += Math.sign(plasma.destY - plasma.y) * 5;
                }
            };
        }
    }

    render () {
        if (process.env.NODE_ENV === "development") {
            this.game.debug.text(this.game.time.fps.toString(), 2, 14);
            this.game.debug.spriteInfo(this.fighter, 32, 32);
        }
    }
}
