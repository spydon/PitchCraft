import * as Phaser from "phaser";

export class Fighter extends Phaser.Sprite {
    rotationSpeed = 0;
    rotationDirection = 0;

    constructor ({game, x, y}) {
        super(game, x, y, "ship");

        this.anchor.setTo(0.5);
        this.scale.setTo(.15);
    }

    updateRotation (direction?: "up" | "down") {
        if (direction === "up") {
            this.rotationSpeed = this.rotationSpeed + 0.02 >= 1 ? 1 : this.rotationSpeed + 0.02;

            this.y -= easeInOutQuart(this.rotationSpeed) * 4;
            this.angle = easeInOutQuart(this.rotationSpeed) * -15;
        } else if (direction === "down") {
            this.rotationSpeed = this.rotationSpeed + 0.02 >= 1 ? 1 : this.rotationSpeed + 0.02;

            this.y += easeInOutQuart(this.rotationSpeed) * 4;
            this.angle = easeInOutQuart(this.rotationSpeed) * 15;
        } else {
            if (this.rotationSpeed > 0) {
                this.rotationSpeed = this.rotationSpeed <= 0 ? 0 : this.rotationSpeed - 0.02;

                if (this.angle > 0) {
                    this.y += easeInOutQuart(this.rotationSpeed) * 4;
                    this.angle = easeInOutQuart(this.rotationSpeed) * 15;
                } else {
                    this.y -= easeInOutQuart(this.rotationSpeed) * 4;
                    this.angle = - easeInOutQuart(this.rotationSpeed) * 15;
                }
            } else {
                this.rotationSpeed = 0;
                this.angle = 0;
            }
        }
    }

    update () { }
}

function easeInOutQuart (t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
