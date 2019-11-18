(function () {
	"use strict";

	const Animation = quick.Animation;
	const Command = quick.Command;
	const FontSprite = quick.FontSprite;
	const Frame = quick.Frame;
	const ImageFactory = quick.ImageFactory;
	const Quick = quick.Quick;
	const Scene = quick.Scene;
	const Sprite = quick.Sprite;

	let lives = -1;
	let media;
	let player;
	let score = 0;

	function init() {
		media = {
			player_standing_left : document.getElementById("player_standing"),
			player_standing_right : Quick.mirror(document.getElementById("player_standing")),
			player_ducking_left : document.getElementById("player_ducking"),
			player_ducking_right : Quick.mirror(document.getElementById("player_ducking")),
			player_jumping_left : document.getElementById("player_jumping"),
			player_jumping_right : Quick.mirror(document.getElementById("player_jumping")),

			player_running_left : new Animation([
				new Frame(document.getElementById("player_running1"), 3),
				new Frame(document.getElementById("player_running2"), 3),
				new Frame(document.getElementById("player_running3"), 3),
				new Frame(document.getElementById("player_running4"), 3)
			]),

			player_running_right : new Animation([
				new Frame(Quick.mirror(document.getElementById("player_running1")), 3),
				new Frame(Quick.mirror(document.getElementById("player_running2")), 3),
				new Frame(Quick.mirror(document.getElementById("player_running3")), 3),
				new Frame(Quick.mirror(document.getElementById("player_running4")), 3)
			]),

			player_toasted : new Animation([
				new Frame(document.getElementById("player_toasted"), 6),
				new Frame(Quick.mirror(document.getElementById("player_toasted")), 6),
				new Frame(document.getElementById("player_toasted"), 6),
				new Frame(Quick.mirror(document.getElementById("player_toasted")), 6)
			]),

			flame : new Animation([
				new Frame(document.getElementById("flame"), 3),
				new Frame(Quick.flip(document.getElementById("flame")), 3)
			]),

			dragon_fireball : new Animation([
				new Frame(document.getElementById("dragonfire"), 3),
				new Frame(Quick.mirror(document.getElementById("dragonfire")), 3)
			]),

			dragon_left : new Animation([
				new Frame(Quick.mirror(document.getElementById("dragon1")), 5),
				new Frame(Quick.mirror(document.getElementById("dragon2")), 5)
			]),

			dragon_right : new Animation([
				new Frame(document.getElementById("dragon1"), 5),
				new Frame(document.getElementById("dragon2"), 5)
			]),

			dragon_spit_left :new Animation([
				new Frame(Quick.mirror(document.getElementById("dragon_spit")), 2),
			]),

			dragon_spit_right : new Animation([
				new Frame(document.getElementById("dragon_spit"), 2),
			]),

			door : document.getElementById("door"),

			loot : [
				document.getElementById("loot1"),
				document.getElementById("loot2"),
				document.getElementById("loot3")
			]
		};
	}

	class BridgeScene extends Scene {
		constructor() {
			super();
			init();
			this.completed = false;
			let background = new BridgeBackground();
			this.add(background);
			this.drawStars();
			this.add(new Bridge());
			this.add(new River());
			let towerLeft = new Tower(true);
			this.add(towerLeft);
			towerLeft.drawDecor();
			let towerRight = new Tower(false);
			this.add(towerRight);
			towerRight.drawDecor();
			let scoreText = new FontSprite("level " + (score+1));
			scoreText.setPosition(200, 10);
			this.add(scoreText);
			let icon = new Sprite();
			icon.setImage(media["player_standing_right"]);
			icon.setPosition(382, 5);
			icon.setSize(12, 22);
			this.add(icon);
			this.updateLives();
			player = new BridgePlayer();
			this.add(player);
			this.createFlames();

			if (lives < 0) {
				this.showText(true);
			} else {
				player.reset();
			}
		}

		get next() {
			if (this.completed) {
				return new CastleScene();
			} else {
				return new BridgeScene();
			}
		}

		// TODO: use https://github.com/diogoeichert/quick/tree/master/plugins/starfield
		drawStars() {
			let star;

			for (let i = 0; i < 30; ++i) {
				star = new Sprite();
				star.setSize(1,1);
				star.setColor("White");
				star.setPosition(Quick.random(Quick.width), Quick.random(Quick.height));
				this.add(star);
			}
		}

		showText(show) {
			if (this.titleText) this.titleText.expire();

			if (show) {
				this.titleText = new FontSprite("           dragonfire\n\n\n\npush a or space to start");
				this.titleText.setCenter(Quick.center);
				this.add(this.titleText);
			}
		}

		success() {
			this.completed = true;
			this.expire();
		}

		createFlames() {
			if (lives < 0) return;

			if (player.burning) {
				player.reset();
			}

			let speed1 = 6 + Quick.random(5) + score;
			let speed2 = 6 + Quick.random(5) + score;

			while (Math.abs(speed1 - speed2) < 3) {
				speed2 = 6 + Quick.random(5) + score;
			}

			this.add(new Flame(true, speed1));
			this.add(new Flame(false, speed2));
			Quick.play("fire");
			this.activeFlames = 2;
		}

		flameDied(isTop) {
			if (--this.activeFlames <= 0) {
				this.createFlames();
			}
		}

		updateLives() {
			if (this.livesText) this.livesText.expire();
			this.livesText = new FontSprite("x " + (lives >= 0 ? lives : "-"));
			this.livesText.setPosition(400, 10);
			this.add(this.livesText);
		}
	}

	// TODO: use https://github.com/diogoeichert/quick/tree/master/plugins/jumper
	const BridgePlayer = (function () {
		const SPEED = 9;
		const W = 12, H = 22, H_DUCKING = 12;

		class BridgePlayer extends Sprite {
			constructor() {
				super();
				this.controller = Quick.getController();
				this.reset();
				this.setSolid();
				this.prevState = "";
				this.setAccelerationY(2);
				this.setVisible(false);
			}

			init() {
				this.setBoundary(this.scene.boundary);
			}

			reset() {
				this.jumping = false;
				this.burning = false;
				this.turnedLeft = true;
				this.setVisible(true);
				this.updateAnimation("standing");
				this.setPosition(Quick.width - this.width - 80, Quick.height / 3 * 2 - 20);
			}

			updateAnimation(state) {
				if (this.jumping && (state != "ducking" && state != "burning")) {
					let feetY = this.bottom;
					this.setImage(this.turnedLeft ? media["player_jumping_left"] : media["player_jumping_right"]);
					this.setSize(W, H);
					this.prevState = state;
				} else if (state != this.prevState) { /* if the state changed, update animation */
					let feetY = this.bottom;
					if (state == "running") {
						this.setAnimation(this.turnedLeft ? media["player_running_left"] : media["player_running_right"]);
						this.setSize(W, H);
					} else if (state == "ducking") {
						let feetY = this.bottom;
						this.setImage(this.turnedLeft ? media["player_ducking_left"] : media["player_ducking_right"]);
						this.setSize(W, H_DUCKING);
					} else if (state == "burning") {
						this.setAnimation(media["player_toasted"]);
						this.setSize(W, H);
					} else {	/* just standing */
						this.setImage(this.turnedLeft ? media["player_standing_left"] : media["player_standing_right"]);
						this.setSize(W, H);
					}
					this.setBottom(feetY);
					this.prevState = state;
				}
			}

			update() {
				if (this.burning && lives >= 0) {
					return;
				}

				if (lives < 0) {
					if (this.controller.keyPush(Command.A)) {
						lives = 6;
						score = 0;
						this.scene.expire();
					}

					return;
				}

				if (this.controller.keyDown(Command.DOWN)) {
					this.updateAnimation("ducking");
				} else {
					if (this.controller.keyDown(Command.LEFT) && this.left > 0) {
						this.x -= SPEED;
						this.turnedLeft = true;
						this.updateAnimation("running");
					} else if (this.controller.keyDown(Command.RIGHT) && this.right < Quick.width) {
						this.x += SPEED;
						this.turnedLeft = false;
						this.updateAnimation("running");
					} else {
						this.updateAnimation("standing");
					}
				}

				if (this.controller.keyPush(Command.A) && !this.jumping) {
					this.setSpeedY(-10);
					this.jumping = true;
					this.updateAnimation("jumping");
					Quick.play("jump");
				}
			}

			onCollision(obj) {
				if (!this.burning) {
					if(obj.hasTag("fire")) {
						this.updateAnimation("burning");
						this.burning = true;
						--lives;
						Quick.play("death");
						if (lives < 0) {
							this.scene.showText(true);
						}
						this.scene.updateLives();
					} else if (obj.hasTag("LeftTower")) {
						this.scene.success();
					}
				}

				if (obj.hasTag("Bridge")) {
					this.stop();
					this.setBottom(obj.top);

					if (this.jumping) {
						this.jumping = false;

						if (!this.burning) {
							this.prevState = "jumping"; // quick fix :P
							this.updateAnimation("standing");
						}
					}
				}
			}

			offBoundary(rct) {
				this.stop();
			}
		}

		return BridgePlayer;
	})();

	class BridgeBackground extends Sprite {
		constructor() {
			super();
			this.setColor("#450045");
			this.setSize(Quick.width, Quick.height);
		}
	}

	class Bridge extends Sprite {
		constructor() {
			super();
			this.setColor("Black");
			this.setSize(Quick.width, 30);
			this.setPosition(0, Quick.height / 3 * 2);
			this.setSolid();
			this.addTag("Bridge");
		}
	}

	class River extends Sprite {
		constructor() {
			super();
			this.setColor("Blue");
			this.setSize(Quick.width, 50);
			this.setBottom(Quick.bottom);
			this.addTag("River");
		}

		update() {
			if (Quick.random(5) == 0) {
				this.setHeight(50 + Quick.random(4));
				this.setBottom(this.scene.bottom);
			}
		}
	}

	class Tower extends Sprite {
		constructor(left) {
			super();
			this.left = left;
			this.setColor("Black");
			this.setSize(60, Quick.height / 6 * 4);

			if (left) {
				this.setPosition(0, Quick.height / 6 * 2);
				this.addTag("LeftTower");
			} else {
				this.setPosition(Quick.width - this.width, Quick.height / 6 * 2);
				this.addTag("RightTower");
			}

			this.setSolid();
			this.setLayerIndex(1);
		}

		drawDecor() {
			let towerTop = new Sprite();
			towerTop.setColor("Black");
			towerTop.setSize(100);
			towerTop.setCenterX(this.centerX);
			towerTop.setBottom(this.top);
			this.scene.add(towerTop);
			let towerTopping;

			for (let i = 0; i < 3; ++i) {
				towerTopping = new Sprite();
				towerTopping.setColor("Black");
				towerTopping.setSize(20);
				towerTopping.setBottom(towerTop.top);
				towerTopping.setLeft((this.left) ? 30 * i : Quick.width - 20 - (30 * i));
				this.scene.add(towerTopping);
			}

			let towerWindow = new Sprite();
			towerWindow.setColor("#450045");
			towerWindow.setSize(20);
			towerWindow.setCenterX(towerTop.centerX);
			towerWindow.setBottom(towerTop.centerY);
			this.scene.add(towerWindow);
		}
	}

	class Flame extends Sprite {
		constructor(isTop, speed) {
			super();
			this.isTop = isTop;
			this.setAnimation(media["flame"]);
			this.setSize(14, 8);

			this.setPosition(
				-Quick.random(90),
				Quick.height / 3 * 2 - (isTop ? 22 : 10));

			this.setSolid();
			this.setSpeedX(speed);
			this.addTag("fire");
		}

		onCollision(obj) {
			if (obj.hasTag("RightTower")) {
				this.scene.flameDied(this.isTop);
				this.expire();
			}
		}
	}

	class CastleScene extends Scene {
		constructor() {
			super();
			this.lootItems = 8;
			let background = new CastleBackground();
			this.add(background);
			player = new CastlePlayer();
			this.add(player);
			this.add(new Dragon());
			this.add(new EntranceGate());

			this.scoreText = new FontSprite("level " + (score + 1));
			this.scoreText.setPosition(200, 10);
			this.add(this.scoreText);

			let icon = new Sprite();
			icon.setImage(media["player_standing_right"]);
			icon.setPosition(382, 5);
			icon.setSize(12, 22);
			this.add(icon);
			this.updateLives();

			for (let i = 0; i < this.lootItems; ++i) {
				this.add(new Loot());
			}
		}

		get next() {
			return new BridgeScene();
		}

		success() {
			++score;
			this.expire();
		}

		caughtLoot() {
			if (--this.lootItems <= 0) {
				this.add(new ExitGate());
			}
		}

		updateLives() {
			if (this.livesText) this.livesText.expire();
			this.livesText = new FontSprite("x " + (lives >= 0 ? lives : "-"));
			this.livesText.setPosition(400, 10);
			this.add(this.livesText);
		}
	}

	// TODO: https://github.com/diogoeichert/quick/tree/master/plugins/controllable
	const CastlePlayer = (function () {
		const SPEED = 13;
		const W = 12, H = 22;

		class CastlePlayer extends Sprite {
			constructor() {
				super();
				this.controller = Quick.getController();
				this.hidden = false;
				this.burning = false;
				this.prevState = "";
				this.turnedLeft = true;
				this.prevLeft = true;
				this.updateAnimation("standing");
				this.setSolid();
				this.startX = Quick.width - this.width - 70;
				this.startY = Quick.height / 3 * 2 - 20;
				this.setPosition(this.startX, this.startY);
			}

			init() {
				this.setBoundary(this.scene.boundary);
			}

			updateAnimation(state) {
				if (this.burning) return;

				if (state != this.prevState || this.prevLeft != this.turnedLeft) {
					let feetY = this.bottom;

					if (state == "burning") {
						this.burning = true;
						this.setAnimation(media["player_toasted"]);
						this.setSize(W, H);
					} else if (state == "running") {
						this.setAnimation(this.turnedLeft ? media["player_running_left"] : media["player_running_right"]);
						this.setSize(W, H);
					} else {
						this.setImage(this.turnedLeft ? media["player_standing_left"] : media["player_standing_right"]);
						this.setSize(W, H);
					}

					this.setBottom(feetY);
				}

				this.prevState = state;
				this.prevLeft = this.turnedLeft;
			}

			update() {
				if (this.burning) {
					return;
				}

				if (this.hidden) {
					if (this.controller.keyDown(Command.LEFT) && this.left > 0) {
						this.setVisible(true);
						this.hidden = false;
						this.setPosition(this.startX, this.startY);
					}
				} else {
					let moved = false;

					if (this.controller.keyDown(Command.LEFT) && this.left > 0) {
						this.x -= SPEED;
						this.turnedLeft = true;
						moved = true;
					} else if (this.controller.keyDown(Command.RIGHT) && this.right < Quick.width) {
						this.x += SPEED;
						this.turnedLeft = false;
						moved = true;
					}

					if (this.controller.keyDown(Command.UP) && this.top > 0) {
						this.y -= SPEED;
						moved = true;
					} else if (this.controller.keyDown(Command.DOWN) && this.bottom < Quick.height) {
						this.y += SPEED;
						moved = true;
					}

					this.updateAnimation(moved ? "running" : "standing");
				}
			}

			onCollision(obj) {
				if (this.burning) {
					return;
				}

				if (!this.hidden) {
					if (obj.hasTag("Hot")) {
						lives--;
						Quick.play("death");
						this.updateAnimation("burning");
						this.scene.updateLives();
					}

					if (obj.hasTag("Loot")) {
						obj.expire();
						this.scene.caughtLoot();
						Quick.play("pickup");
					}

					if (obj.hasTag("ExitGate")) {
						this.scene.success();
					}

					if (obj.hasTag("EntranceGate")) {
						this.hidden = true;
						this.setVisible(false);
					}
				}
			}

			onAnimationLoop() {
				if (!this.burning) {
					return;
				}

				if (lives < 0) {
					this.scene.completed = true;
					this.scene.expire();
				} else {
					this.burning = false;
					this.hidden = false;
					this.setPosition(this.startX, this.startY);
					this.turnedLeft = true;
					this.updateAnimation();
				}
			}

			offBoundary(rct) {
				this.stop();
			}
		}

		return CastlePlayer;
	})();

	let Dragon = (function () {
		let SPEED = 4;

		class Dragon extends Sprite {
			constructor() {
				super();
				this.addTag("Hot");
				this.goingLeft = false;
				this.prevLeft = true;
				this.spitting = false;
				this.updateAnimation();
				this.setSize(120, 46);
				this.setPosition(60, Quick.height - 60);
				this.setSolid();
			}

			updateAnimation() {
				if (this.prevLeft == this.goingLeft) {
					return;
				}

				if (this.goingLeft) {
					this.setAnimation(media["dragon_left"]);
				} else {
					this.setAnimation(media["dragon_right"]);
				}

				this.prevLeft = this.goingLeft;
			}

			onAnimationLoop() {
				if (!this.spitting) {
					return;
				}

				this.spitting = false;
				this.updateAnimation();
			}

			update() {
				if (player.hidden || player.burning) {
					if (this.goingLeft) {
						this.x -= SPEED + score;

						if (this.x < 100) {
							this.goingLeft = false;
							this.updateAnimation();
						}
					} else {
						this.x += SPEED + score;

						if (this.x > Quick.width - 230) {
							this.goingLeft = true;
							this.updateAnimation();
						}
					}
				} else {	/* after the player */
					if (this.right < player.centerX-10) {
						this.x += SPEED + score;
						this.goingLeft = false;
					} else if (this.right > player.centerX+10) {
						this.x -= SPEED + score;
						this.goingLeft = true;
					} else { /* standing still to shoot */
						this.goingLeft = false;
					}

					if (Quick.random(100 + (score * 5)) > 95) {
						this.scene.add(
							new DragonFireball(
								this.goingLeft ? this.left : this.right,
								this.centerY
							)
						);

						if (!this.spitting) {
							this.spitting = true;
							this.setAnimation(this.goingLeft ? media["dragon_spit_left"] : media["dragon_spit_right"]);
						}
					}
				}
			}
		}

		return Dragon;
	})();

	class DragonFireball extends Sprite {
		constructor(x, y) {
			super();
			this.addTag("Hot");
			this.controller = Quick.getController();
			this.setAnimation(media["dragon_fireball"]);
			this.setSize(20, 20);
			this.setPosition(x + 5 - Quick.random(16), y);
			this.setSpeedY(-6);
			this.setSolid();
			Quick.play("fire");
		}

		init() {
			this.setBoundary(this.scene.boundary);
		}
	}

	class CastleBackground extends Sprite {
		constructor() {
			super();
			this.setColor("#101010");
			this.setSize(Quick.width, Quick.height);
		}
	}

	class EntranceGate extends Sprite {
		constructor() {
			super();
			this.addTag("EntranceGate");
			this.setImage(media["door"]);
			this.setSize(40, 45);
			this.setPosition(Quick.width - 60, Quick.height - 180);
			this.setSolid();
		}
	}

	class ExitGate extends Sprite {
		constructor() {
			super();
			this.addTag("ExitGate")
			this.setImage(document.getElementById("door"));
			this.setSize(40, 45);
			this.setPosition(40, 40);
			this.setSolid();
		}
	}

	class Loot extends Sprite {
		constructor() {
			super();
			this.addTag("Loot");
			this.setImage(media["loot"][Quick.random(2)]);
			this.setSize(20, 20);

			this.setPosition(
				100 + Quick.random(Quick.width-200),
				60 + Quick.random(Quick.height-160)
			);

			this.setSolid();
		}
	}

	Quick.setName("Dragonfire");
	Quick.setFrameTime(30);
	Quick.init(new BridgeScene());
})();
