import * as Phaser from "phaser";
import {easeInOutQuart} from "utils";

export class Fighter extends Phaser.Sprite {
    rotationSpeed = 0;
    rotationDirection = 0;
    score = 0;
    hitpoints = 100;
    name = "";
    text: Phaser.Text;

    constructor ({game, x, y, name, asset, tx, ty}) {
        super(game, x, y, asset);

        this.anchor.setTo(0.5);
        this.scale.setTo(.15);
        this.name = name;

        this.text = this.game.add.text(tx, ty, this.name + "", {
            font: "20px Arial",
            fill: "#ff0044",
            align: "left"
        });
        this.updateText();
    }

    updateRotation (direction?: "up" | "down") {
        if (direction === "up") {
            this.rotationSpeed = this.rotationSpeed + 0.05 >= 1 ? 1 : this.rotationSpeed + 0.02;

            this.body.velocity.y = - easeInOutQuart(this.rotationSpeed) * 1000;
            this.angle = easeInOutQuart(this.rotationSpeed) * -20;
        } else if (direction === "down") {
            this.rotationSpeed = this.rotationSpeed + 0.05 >= 1 ? 1 : this.rotationSpeed + 0.02;

            this.body.velocity.y = easeInOutQuart(this.rotationSpeed) * 1000;
            this.angle = easeInOutQuart(this.rotationSpeed) * 20;
        } else {
            if (this.rotationSpeed > 0) {
                this.rotationSpeed = this.rotationSpeed <= 0 ? 0 : this.rotationSpeed - 0.05;

                if (this.angle > 0) {
                    this.body.velocity.y = easeInOutQuart(this.rotationSpeed) * 50;
                    this.angle = easeInOutQuart(this.rotationSpeed) * 20;
                } else {
                    this.body.velocity.y = easeInOutQuart(this.rotationSpeed) * 50;
                    this.angle = - easeInOutQuart(this.rotationSpeed) * 20;
                }
            } else {
                this.rotationSpeed = 0;
                this.angle = 0;
            }
        }
    }

    updateText () {
        this.text.setText(this.name + "\nScore: " + this.score + "\nHP: " + this.hitpoints);
    }

    update () { }
}
