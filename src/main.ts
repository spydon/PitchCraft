/// <reference path="../@types/phaser.d.ts"/>
import * as Phaser from "phaser";

import {BootState} from "states/Boot";
import {SplashState} from "states/Splash";
import {GameState} from "states/Game";

class Game extends Phaser.Game {
    constructor () {
        super(1280, 800, Phaser.CANVAS, "game", null);

        this.state.add("Boot", BootState, false);
        this.state.add("Splash", SplashState, false);
        this.state.add("Game", GameState, false);

        this.state.start("Boot");
    }
}

const game = new Game();
