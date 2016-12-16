import * as Phaser from "phaser";
import {Fighter} from "sprites/Fighter";
import {Plasma} from "sprites/Plasma";
import {PitchDetect} from "audio/PitchDetect";
import {Sky, Background, Foreground} from "sprites/Background";
import {setResponsiveWidth} from "utils";

export class GameState extends Phaser.State {
    fighter: Fighter;
    fighter2: Fighter;
    plasmas: Phaser.Group;
    obstacles: Phaser.Group;
    forwards: Phaser.Group;
    backwards: Phaser.Group;
    background;
    pitchDetect: PitchDetect;

    create () {
        this.pitchDetect = new PitchDetect();
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        if (process.env.NODE_ENV === "development") {
            this.game.time.advancedTiming = true;
        }

        this.background = {
            sky: new Sky({game: this.game}),
            background: new Background({game: this.game}),
            foreground: new Foreground({game: this.game})
        };
        this.game.add.existing(this.background.sky);
        this.game.add.existing(this.background.background);
        this.game.add.existing(this.background.foreground);

        this.plasmas = this.game.add.group();
        this.plasmas.createMultiple(100, "plasma");
        this.plasmas.setAll("anchor.x", 0.5);
        this.plasmas.setAll("anchor.y", 0.5);
        this.plasmas.setAll("outOfBoundsKill", true);
        this.plasmas.setAll("checkWorldBounds", true);
        this.game.physics.enable(this.plasmas, Phaser.Physics.ARCADE);

        this.obstacles = this.game.add.group();
        this.obstacles.createMultiple(20, "obstacle");
        this.obstacles.setAll("anchor.x", 0.2);
        this.obstacles.setAll("anchor.y", 0.2);
        this.obstacles.setAll("outOfBoundsKill", true);
        this.obstacles.setAll("checkWorldBounds", true);
        this.game.physics.enable(this.obstacles, Phaser.Physics.ARCADE);

        this.forwards = this.game.add.group();
        this.forwards.createMultiple(20, "forward");
        this.forwards.setAll("anchor.x", 0.5);
        this.forwards.setAll("anchor.y", 0.5);
        this.forwards.setAll("outOfBoundsKill", true);
        this.forwards.setAll("checkWorldBounds", true);
        this.game.physics.enable(this.forwards, Phaser.Physics.ARCADE);

        this.backwards = this.game.add.group();
        this.backwards.createMultiple(20, "backward");
        this.backwards.setAll("anchor.x", 0.5);
        this.backwards.setAll("anchor.y", 0.5);
        this.backwards.setAll("outOfBoundsKill", true);
        this.backwards.setAll("checkWorldBounds", true);
        this.game.physics.enable(this.backwards, Phaser.Physics.ARCADE);


        this.fighter = new Fighter({game: this.game, x: 120, y: 300, name: "Anders",
        asset: "fighter", tx: 50, ty: 50});
        this.game.add.existing(this.fighter);

        this.fighter2 = new Fighter({game: this.game, x: 120, y: process.env.HEIGHT - 300, name: "Grenis",
            asset: "fighter2", tx: process.env.WIDTH - 200, ty: 50});
        this.game.add.existing(this.fighter2);

        this.game.physics.enable([this.fighter, this.fighter2], Phaser.Physics.ARCADE);
        this.fighter.checkWorldBounds = true;
        this.fighter.body.collideWorldBounds = true;
        this.fighter.body.bounce.setTo(1, 1);
        this.fighter2.checkWorldBounds = true;
        this.fighter2.body.collideWorldBounds = true;
        this.fighter2.body.bounce.setTo(1, 1);
    }

    update() {
        if (this.game.input.keyboard.isDown(Phaser.Keyboard.W)) {
            this.fighter.updateRotation("up");
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.S)) {
            this.fighter.updateRotation("down");
        } else {
            this.fighter.updateRotation();
        }

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.UP)) {
            this.fighter2.updateRotation("up");
        } else if (this.game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
            this.fighter2.updateRotation("down");
        } else {
            this.fighter2.updateRotation();
        }

        if (Math.random() < 0.1) {
            this.createPlasma();
        } else if (Math.random() < 0.03) {
            this.createObstacle();
        } else if (Math.random() < 0.01) {
            if (Math.random() >= 0.5) {
                this.createForward();
            } else {
                this.createBackward();
            }
        }

        this.game.physics.arcade.overlap(this.fighter, this.plasmas, this.plasmaCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter, this.obstacles, this.obstacleCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter, this.forwards, this.forwardCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter, this.backwards, this.backwardCollision, null, this);

        this.game.physics.arcade.overlap(this.fighter2, this.plasmas, this.plasmaCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter2, this.obstacles, this.obstacleCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter2, this.forwards, this.forwardCollision, null, this);
        this.game.physics.arcade.overlap(this.fighter2, this.backwards, this.backwardCollision, null, this);

        this.game.physics.arcade.collide(this.fighter, this.fighter2, null, null, this);
    }

    createPlasma () {
        let plasma = this.plasmas.getFirstExists(false);
        if (plasma) {
            plasma.destY = null;
            plasma.reset(process.env.WIDTH + plasma.width / 2 - 1, process.env.HEIGHT / 2);
            plasma.scale.setTo(0.1);
            plasma.update = () => {
                plasma.angle += 5;
                plasma.x -= 2;
                if (plasma.x < process.env.WIDTH - 300 && !plasma.destY) {
                    plasma.destY = this.pitchDetect.getY(process.env.HEIGHT - plasma.height) + plasma.height / 2;
                } else if (plasma.destY && (plasma.y < plasma.destY - 10 || plasma.y > plasma.destY + 10)) {
                    plasma.y += Math.sign(plasma.destY - plasma.y) * 5;
                }
            };
        }
    }

    createObstacle () {
        let obstacle = this.obstacles.getFirstExists(false);
        if (obstacle) {
            obstacle.destY = null;
            obstacle.reset(process.env.WIDTH + obstacle.width / 2 - 1, process.env.HEIGHT / 2);
            obstacle.scale.setTo(0.1);
            obstacle.update = () => {
                obstacle.angle += 5;
                obstacle.x -= 2;
                if (obstacle.x < process.env.WIDTH - 300 && !obstacle.destY) {
                    obstacle.destY = this.pitchDetect.getY(process.env.HEIGHT - obstacle.height) + obstacle.height / 2;
                } else if (obstacle.destY && (obstacle.y < obstacle.destY - 10 || obstacle.y > obstacle.destY + 10)) {
                    obstacle.y += Math.sign(obstacle.destY - obstacle.y) * 5;
                }
            };
        }
    }

    createForward () {
        let forward = this.forwards.getFirstExists(false);
        if (forward) {
            forward.destY = null;
            forward.reset(process.env.WIDTH + forward.width / 2 - 1, process.env.HEIGHT / 2);
            forward.scale.setTo(0.1);
            forward.update = () => {
                forward.x -= 2;
                if (forward.x < process.env.WIDTH - 300 && !forward.destY) {
                    forward.destY = this.pitchDetect.getY(process.env.HEIGHT - forward.height) + forward.height / 2;
                } else if (forward.destY && (forward.y < forward.destY - 10 || forward.y > forward.destY + 10)) {
                    forward.y += Math.sign(forward.destY - forward.y) * 5;
                }
            };
        }
    }

    createBackward () {
        let backward = this.backwards.getFirstExists(false);
        if (backward) {
            backward.destY = null;
            backward.reset(process.env.WIDTH + backward.width / 2 - 1, process.env.HEIGHT / 2);
            backward.scale.setTo(0.1);
            backward.update = () => {
                backward.x -= 2;
                if (backward.x < process.env.WIDTH - 300 && !backward.destY) {
                    backward.destY = this.pitchDetect.getY(process.env.HEIGHT - backward.height) + backward.height / 2;
                } else if (backward.destY && (backward.y < backward.destY - 10 || backward.y > backward.destY + 10)) {
                    backward.y += Math.sign(backward.destY - backward.y) * 5;
                }
            };
        }
    }


    plasmaCollision (fighter: Fighter, plasma) {
        fighter.score += 1000;
        fighter.updateText();
        plasma.kill();
    }

    obstacleCollision (fighter: Fighter, obstacle) {
        fighter.hitpoints -= Math.floor((fighter.x / process.env.WIDTH) * 50);
        if (fighter.hitpoints <= 0) {
            fighter.kill();
        } else {
            fighter.alpha = fighter.hitpoints / 100;
            obstacle.kill();
        }
        fighter.updateText();
    }

    forwardCollision (fighter: Fighter, forward) {
        if (fighter.x + 100 < process.env.WIDTH) {
            fighter.body.velocity.x = 300;
            setTimeout(() => {
                fighter.body.velocity.x = 0;
            }, 1000);
        }
        forward.kill();
    }

    backwardCollision (fighter: Fighter, backward) {
        if (fighter.x - 100 > 0) {
            fighter.body.velocity.x = -300;
            setTimeout(() => {
                fighter.body.velocity.x = 0;
            }, 1000);
        }
        backward.kill();
    }

    render () {
        if (process.env.NODE_ENV === "development") {
            this.game.debug.text(this.game.time.fps.toString(), 2, 14);
        }
    }
}
