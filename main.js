(function () {
	"use strict";

	var CommandEnum = com.dgsprb.quick.CommandEnum;
	var Quick = com.dgsprb.quick.Quick;
	var GameObject = com.dgsprb.quick.Rect;
	var GameObject = com.dgsprb.quick.GameObject;
	var Scene = com.dgsprb.quick.Scene;
	var Animation = com.dgsprb.quick.Animation;
	var ImageFactory = com.dgsprb.quick.ImageFactory;
	var Frame = com.dgsprb.quick.Frame;
	var Text = com.dgsprb.quick.Text;

	var player;
	var score = 0;
	var lifes = -1;

	var media;

	function init() {
		media = {
			player_standing_left : document.getElementById("player_standing"),
			player_standing_right : ImageFactory.mirror(document.getElementById("player_standing")),
			player_ducking_left : document.getElementById("player_ducking"),
			player_ducking_right : ImageFactory.mirror(document.getElementById("player_ducking")),
			player_jumping_left : document.getElementById("player_jumping"),
			player_jumping_right : ImageFactory.mirror(document.getElementById("player_jumping")),
			player_running_left : new Animation([
				new Frame(document.getElementById("player_running1"), 3),
				new Frame(document.getElementById("player_running2"), 3),
				new Frame(document.getElementById("player_running3"), 3),
				new Frame(document.getElementById("player_running4"), 3)
			]),
			player_running_right : new Animation([
				new Frame(ImageFactory.mirror(document.getElementById("player_running1")), 3),
				new Frame(ImageFactory.mirror(document.getElementById("player_running2")), 3),
				new Frame(ImageFactory.mirror(document.getElementById("player_running3")), 3),
				new Frame(ImageFactory.mirror(document.getElementById("player_running4")), 3)
			]),
			player_toasted : new Animation([
				new Frame(document.getElementById("player_toasted"), 6),
				new Frame(ImageFactory.mirror(document.getElementById("player_toasted")), 6),
				new Frame(document.getElementById("player_toasted"), 6),
				new Frame(ImageFactory.mirror(document.getElementById("player_toasted")), 6)
			]),

			flame : new Animation([
				new Frame(document.getElementById("flame"), 3),
				new Frame(ImageFactory.flip(document.getElementById("flame")), 3)
			]),
			dragon_fireball : new Animation([
				new Frame(document.getElementById("dragonfire"), 3),
				new Frame(ImageFactory.mirror(document.getElementById("dragonfire")), 3)
			]),

			dragon_left : new Animation([
				new Frame(ImageFactory.mirror(document.getElementById("dragon1")), 5),
				new Frame(ImageFactory.mirror(document.getElementById("dragon2")), 5)
			]),
			dragon_right : new Animation([
				new Frame(document.getElementById("dragon1"), 5),
				new Frame(document.getElementById("dragon2"), 5)
			]),
			dragon_spit_left :new Animation([
				new Frame(ImageFactory.mirror(document.getElementById("dragon_spit")), 2),
			]),
			dragon_spit_right : new Animation([
				new Frame(document.getElementById("dragon_spit"), 2),
			]),

			door : document.getElementById("door"),
			loot : 	[
				document.getElementById("loot1"),
				document.getElementById("loot2"),
				document.getElementById("loot3")
			]
		}
	}

	function main() {
		Quick.setName("Dragonfire");
		Quick.setNumberOfLayers(2);
		Quick.init(function () { return new BridgeScene() });
	}

	var BridgeScene = (function () {

		function BridgeScene() {
			Scene.call(this);
			init();
			this.completed = false;
			var background = new BridgeBackground();
			this.add(background);
			this.drawStars();
			this.add(new Bridge());
			this.add(new River());
			var towerLeft = new Tower(true);
			this.add(towerLeft);
			towerLeft.drawDecor();
			var towerRight = new Tower(false);
			this.add(towerRight);
			towerRight.drawDecor();
			var scoreText = new Text("level " + (score+1));
			scoreText.setPosition(200, 10);
			this.add(scoreText);
			var icon = new GameObject();
			icon.setImage(media['player_standing_right']);
			icon.setPosition(382, 5);
			icon.setSize(12, 22);
			this.add(icon);
			this.updateLifes();
			player = new BridgePlayer();
			this.add(player);
			this.createFlames();
			if (lifes < 0) {
				this.showText(true);
			} else {
				player.reset();
			}
		}; BridgeScene.prototype = Object.create(Scene.prototype);

		BridgeScene.prototype.getNext = function () {
			if (this.completed) {
				return new CastleScene();
			} else {
				return new BridgeScene();
			}
		}

		BridgeScene.prototype.drawStars = function () {
			var star;
			for(var i=0;i<30;i++) {
				star = new GameObject();
				star.setSize(1,1);
				star.setColor("White");
				star.setPosition(Quick.random(Quick.getCanvasWidth()), Quick.random(Quick.getCanvasHeight()));
				this.add(star);
			}
		}

		BridgeScene.prototype.showText = function(show) {
			if (this.titleText) this.titleText.expire();
			if (show) {
				this.titleText = new Text("        dragonfire\n\n\n\npress space to start");
				this.titleText.setCenterFromPoint(Quick.getCanvasCenter());
				this.add(this.titleText);
			}
		}

		BridgeScene.prototype.success = function () {
			this.completed = true;
			this.expire();
		}

		BridgeScene.prototype.createFlames = function() {
			if (lifes < 0) return;
			if (player.burning) {
				player.reset();
			}
			var speed1 = 6 + Quick.random(5) + score;
			var speed2 = 6 + Quick.random(5) + score;
			while (Math.abs(speed1-speed2)<3) {
				speed2 = 6 + Quick.random(5) + score;
			}
			this.add(new Flame(true, speed1));
			this.add(new Flame(false, speed2));
			this.activeFlames=2;
		}

		BridgeScene.prototype.flameDied = function(isTop) {
			this.activeFlames--;
			if (this.activeFlames<=0) {
				this.createFlames();
			}
		}

		BridgeScene.prototype.updateLifes = function() {
			if (this.lifesText) this.lifesText.expire();
			this.lifesText = new Text("x " + (lifes >= 0 ? lifes : "-"));
			this.lifesText.setPosition(400, 10);
			this.add(this.lifesText);
		}

		return BridgeScene;
	})();

	var BridgePlayer = (function () {
		
		var SPEED = 9;
		var W = 12, H = 22, H_DUCKING = 12;

		function BridgePlayer() {
			GameObject.call(this);
			this.controller = Quick.getController();
			this.reset();
			this.setSolid();
			this.prevState = "";
			this.setBoundary(Quick.getBoundary());
			this.setAccelerationY(2);
			this.setVisible(false);
		}; BridgePlayer.prototype = Object.create(GameObject.prototype);

		BridgePlayer.prototype.reset = function () {
			this.jumping = false;
			this.burning = false;
			this.turnedLeft = true;
			this.setVisible(true);
			this.updateAnimation("standing");
			this.setPosition(Quick.getCanvasWidth()-this.getWidth()-80, Quick.getCanvasHeight()/3*2-20);
		}

		BridgePlayer.prototype.updateAnimation = function (state) {
			if (this.jumping && (state != "ducking" && state != "burning")) {
				var feetY = this.getBottom();
				this.setImage(this.turnedLeft ? media['player_jumping_left'] : media['player_jumping_right']);
				this.setSize(W, H);
				this.prevState = state;
			} else if (state != this.prevState) { /* if the state changed, update animation */
				var feetY = this.getBottom();
				if (state == "running") {
					this.setAnimation(this.turnedLeft ? media['player_running_left'] : media['player_running_right']);
					this.setSize(W, H);
				} else if (state == "ducking") {
					var feetY = this.getBottom();
					this.setImage(this.turnedLeft ? media['player_ducking_left'] : media['player_ducking_right']);
					this.setSize(W, H_DUCKING);
				} else if (state == "burning") {
					this.setAnimation(media['player_toasted']);
					this.setSize(W, H);
				} else {	/* just standing */
					this.setImage(this.turnedLeft ? media['player_standing_left'] : media['player_standing_right']);
					this.setSize(W, H);
				}
				this.setBottom(feetY);
				this.prevState = state;
			}
		}

		BridgePlayer.prototype.update = function () {
			if (this.burning && lifes >= 0) {
				return;
			}
			if (lifes < 0) {
				if (this.controller.keyPush(CommandEnum.A)) {
					lifes = 6;
					score = 0;
					this.getScene().expire();
				} 

				return;
			}
			if (this.controller.keyDown(CommandEnum.DOWN)) {
				this.updateAnimation("ducking");
			} else {
				if (this.controller.keyDown(CommandEnum.LEFT) && this.getLeft() > 0) {
					this.moveX(-SPEED);
					this.turnedLeft = true;
					this.updateAnimation("running");
				} else if (this.controller.keyDown(CommandEnum.RIGHT) && this.getRight() < Quick.getCanvasWidth()) {
					this.moveX(SPEED);
					this.turnedLeft = false;
					this.updateAnimation("running");
				} else {
					this.updateAnimation("standing");
				}
			}
			if (this.controller.keyPush(CommandEnum.A) && !this.jumping) {
				this.setSpeedY(-10);
				this.jumping = true;
				this.updateAnimation("jumping");
			} 
		};

		BridgePlayer.prototype.onCollision = function(obj) {
			if (!this.burning) {
				if(obj.hasTag("fire")) {
					this.updateAnimation("burning");
					this.burning = true;
					lifes--;
					if (lifes < 0) {
						this.getScene().showText(true);
					}
					this.getScene().updateLifes();
				} else if (obj.hasTag("LeftTower")) {
					this.getScene().success();
				}
			}
			if (obj.hasTag("Bridge")) {
				this.stop();
				this.setBottom(obj.getTop());
				if (this.jumping) {
					this.jumping = false;
					if (!this.burning) {
						this.prevState = "jumping"; // quick fix :P
						this.updateAnimation("standing");
					}
				}
			}
		};

		BridgePlayer.prototype.offBoundary = function(rct) {
			this.stop();
		};

		return BridgePlayer;
	})();

	var BridgeBackground = (function () {

		function BridgeBackground() {
			GameObject.call(this);
			this.setColor("#450045");
			this.setSize(Quick.getCanvasWidth(), Quick.getCanvasHeight());
		}; BridgeBackground.prototype = Object.create(GameObject.prototype);

		return BridgeBackground;
	})();

	var Bridge = (function () {

		function Bridge() {
			GameObject.call(this);
			this.setColor("Black");
			this.setSize(Quick.getCanvasWidth(), 30);
			this.setPosition(0, Quick.getCanvasHeight()/3*2);
			this.setSolid();
			this.addTag("Bridge");
		}; Bridge.prototype = Object.create(GameObject.prototype);

		return Bridge;
	})();

	var River = (function () {

		function River() {
			GameObject.call(this);
			this.setColor("Blue");
			this.setSize(Quick.getCanvasWidth(), 50);
			this.setPosition(0, Quick.getCanvasHeight()-this.getHeight());
			this.addTag("River");
		}; River.prototype = Object.create(GameObject.prototype);

		River.prototype.update = function () {
			if (Quick.random(5)==0) {
				var BottomY = this.getBottom();
				this.setHeight(50 + Quick.random(4));
				this.setBottom(BottomY);
			}
		}

		return River;
	})();

	var Tower = (function () {
		
		function Tower(left) {
			GameObject.call(this);
			this.setColor("Black");
			this.setSize(60, Quick.getCanvasHeight()/6*4);
			if (left) {
				this.setPosition(0, Quick.getCanvasHeight()/6*2);
				this.addTag("LeftTower");
			} else {
				this.setPosition(Quick.getCanvasWidth()-this.getWidth(), Quick.getCanvasHeight()/6*2);
				this.addTag("RightTower");
			}
			this.setSolid();
			this.setLayerIndex(1);
		}; Tower.prototype = Object.create(GameObject.prototype);

		Tower.prototype.drawDecor = function() {
			var towerTop = new GameObject();
			towerTop.setColor("Black");
			towerTop.setSize(100);
			towerTop.setCenterX(this.getCenterX());
			towerTop.setBottom(this.getTop());
			this.getScene().add(towerTop);
		}

		return Tower;
	})();

	var Flame = (function () {

		function Flame(isTop, speed) {
			GameObject.call(this);
			this.isTop = isTop;
			this.setAnimation(media['flame']);
			this.setSize(14, 8);
			this.setPosition(
				-Quick.random(90), 
				Quick.getCanvasHeight()/3*2-(isTop ? 22 : 10));
			this.setSolid();
			this.setSpeedX(speed);
			this.addTag("fire");
		}; Flame.prototype = Object.create(GameObject.prototype);

		Flame.prototype.onCollision = function(obj) {
			if (obj.hasTag("RightTower")) {
				this.getScene().flameDied(this.isTop);
				this.expire();
			}
		}

		return Flame;
	})();


/*
================================================================
=== Castle =====================================================
================================================================
*/
	var CastleScene = (function () {

		function CastleScene() {
			Scene.call(this);
			this.lootItems = 8;
			var background = new CastleBackground();
			this.add(background);
			player = new CastlePlayer();
			this.add(player);
			this.add(new Dragon());
			this.add(new EntranceGate());

			this.scoreText = new Text("level " + (score+1));
			this.scoreText.setPosition(200, 10);
			this.add(this.scoreText);

			var icon = new GameObject();
			icon.setImage(media['player_standing_right']);
			icon.setPosition(382, 5);
			icon.setSize(12, 22);
			this.add(icon);
			this.updateLifes();

			for(var i=0; i<this.lootItems;i++) {
				this.add(new Loot());
			}
		}; CastleScene.prototype = Object.create(Scene.prototype);

		CastleScene.prototype.getNext = function () {
			return new BridgeScene();
		}

		CastleScene.prototype.success = function () {
			score++;
			this.expire();
		}

		CastleScene.prototype.caughtLoot = function () {
			this.lootItems--;
			if (this.lootItems<=0) {
				this.add(new ExitGate());
			}
		}

		CastleScene.prototype.updateLifes = function() {
			if (this.lifesText) this.lifesText.expire();
			this.lifesText = new Text("x " + (lifes >= 0 ? lifes : "-"));
			this.lifesText.setPosition(400, 10);
			this.add(this.lifesText);
		}

		return CastleScene;
	})();

	var CastlePlayer = (function () {
		
		var SPEED = 13;
		var W = 12, H = 22;
		
		function CastlePlayer() {
			GameObject.call(this);
			this.controller = Quick.getController();
			this.hidden = false;
			this.burning = false;
			this.prevState = "";
			this.turnedLeft = true;
			this.prevLeft = true;
			this.updateAnimation("standing");
			this.setSolid();
			this.startX = Quick.getCanvasWidth()-this.getWidth()-70;
			this.startY = Quick.getCanvasHeight()/3*2-20;
			this.setPosition(this.startX, this.startY);
			this.setBoundary(Quick.getBoundary());
		}; CastlePlayer.prototype = Object.create(GameObject.prototype);

		CastlePlayer.prototype.updateAnimation = function (state) {
			if (this.burning) return;

			if (state != this.prevState || this.prevLeft != this.turnedLeft) { /* if the state changed, update animation */
				var feetY = this.getBottom();
				if (state == "burning") {
					this.burning = true;
					this.setAnimation(media['player_toasted']);
					this.setSize(W, H);
				} else if (state == "running") {
					this.setAnimation(this.turnedLeft ? media['player_running_left'] : media['player_running_right']);
					this.setSize(W, H);
				} else {	/* just standing */
					this.setImage(this.turnedLeft ? media['player_standing_left'] : media['player_standing_right']);
					this.setSize(W, H);
				}
				this.setBottom(feetY);
			}
			this.prevState = state;
			this.prevLeft = this.turnedLeft;
		}

		CastlePlayer.prototype.update = function () {
			if (this.burning) return;

			if (this.hidden) {
				if (this.controller.keyDown(CommandEnum.LEFT) && this.getLeft() > 0) {
					this.setVisible(true);
					this.hidden = false;
					this.setPosition(this.startX, this.startY);
				}
			} else {
				var moved = false;
				if (this.controller.keyDown(CommandEnum.LEFT) && this.getLeft() > 0) {
					this.moveX(-SPEED);
					this.turnedLeft = true;
					moved = true;
				} else if (this.controller.keyDown(CommandEnum.RIGHT) && this.getRight() < Quick.getCanvasWidth()) {
					this.moveX(SPEED);
					this.turnedLeft = false;
					moved = true;
				}
				if (this.controller.keyDown(CommandEnum.UP) && this.getTop() > 0) {
					this.moveY(-SPEED);
					moved = true;
				} else if (this.controller.keyDown(CommandEnum.DOWN) && this.getBottom() < Quick.getCanvasHeight()) {
					this.moveY(SPEED);
					moved = true;
				}
				this.updateAnimation(moved ? "running" : "standing");
			}
		};

		CastlePlayer.prototype.onCollision = function(obj) {
			if (this.burning) return;

			if (!this.hidden) {
				if (obj.hasTag("Hot")) {
					lifes--;
					this.updateAnimation("burning");
					this.getScene().updateLifes();
				}
				if (obj.hasTag("Loot")) {
					obj.expire();
					this.getScene().caughtLoot();
				}
				if (obj.hasTag("ExitGate")) {
					this.getScene().success();
				}
				if (obj.hasTag("EntranceGate")) {
					this.hidden = true;
					this.setVisible(false);
				}
			}
		};

		CastlePlayer.prototype.onAnimationLoop = function() {
			if (this.burning) {
				if (lifes < 0) {
					this.getScene().completed = true;
					this.getScene().expire();
				} else {
					this.burning = false;
					this.hidden = false;
					this.setPosition(this.startX, this.startY);
					this.turnedLeft = true;
					this.updateAnimation();				
				}
			}
		}

		CastlePlayer.prototype.offBoundary = function(rct) {
			this.stop();
		};

		return CastlePlayer;
	})();

	var Dragon = (function () {
		var SPEED = 4;
		
		function Dragon() {
			GameObject.call(this);
			this.addTag("Hot");
			this.goingLeft = false;
			this.prevLeft = true;
			this.spitting = false;
			this.updateAnimation();
			this.setSize(120, 46);
			this.setPosition(60, Quick.getCanvasHeight()-60);
			this.setSolid();
		}; Dragon.prototype = Object.create(GameObject.prototype);

		Dragon.prototype.updateAnimation = function () {
			if (this.prevLeft != this.goingLeft) {
				if (this.goingLeft) {
					this.setAnimation(media['dragon_left']);
				} else {
					this.setAnimation(media['dragon_right']);
				}
				this.prevLeft = this.goingLeft;
			}
		};

		Dragon.prototype.onAnimationLoop = function () {
			if (this.spitting) {
				this.spitting = false;
				this.updateAnimation();
			}
		};

		Dragon.prototype.update = function () {
			if (player.hidden || player.burning) {	/* idle */
				if (this.goingLeft) {
					this.moveX(-SPEED - score)
					if (this.getX() < 100) {
						this.goingLeft = false;
						this.updateAnimation();
					}
				} else {
					this.moveX(SPEED + score)
					if (this.getX() > Quick.getCanvasWidth()-230) {
						this.goingLeft = true;
						this.updateAnimation();
					}
				}
			} else {	/* after the player */
				if (this.getRight() < player.getCenterX()-10) {
					this.moveX(SPEED + score);
					this.goingLeft = false;
				} else if (this.getRight() > player.getCenterX()+10) {
					this.moveX(-SPEED - score);
					this.goingLeft = true;
				} else { /* standing still to shoot */
					this.goingLeft = false;
				}
				/* Shoot Fire */
				if (Quick.random(100+(score*5))>95) {
					this.getScene().add(
						new DragonFireball(
							this.goingLeft ? this.getLeft() : this.getRight(),
							this.getCenterY()
						)
					);
					if (!this.spitting) {
						this.spitting = true;
						this.setAnimation(this.goingLeft ? media['dragon_spit_left'] : media['dragon_spit_right']);
					}
				}
			}
		};

		return Dragon;
	})();

	var DragonFireball = (function () {
		
		function DragonFireball(x, y) {
			GameObject.call(this);
			this.addTag("Hot");
			this.controller = Quick.getController();
			this.setAnimation(media['dragon_fireball']);
			this.setSize(20, 20);
			this.setPosition(x+5-Quick.random(16), y);
			this.setSpeedY(-6);
			this.setBoundary(Quick.getBoundary());
			this.setSolid();
		}; DragonFireball.prototype = Object.create(GameObject.prototype);

		DragonFireball.prototype.offBoundary = function () {
			this.expire();
		};

		return DragonFireball;
	})();

	var CastleBackground = (function () {

		function CastleBackground() {
			GameObject.call(this);
			this.setColor("#101010");
			this.setSize(Quick.getCanvasWidth(), Quick.getCanvasHeight());
		}; CastleBackground.prototype = Object.create(GameObject.prototype);

		return CastleBackground;
	})();

	var EntranceGate = (function () {

		function EntranceGate() {
			GameObject.call(this);
			this.addTag("EntranceGate");
			this.setImage(media['door']);
			this.setSize(40, 45);
			this.setPosition(Quick.getCanvasWidth()-60, Quick.getCanvasHeight()-180);
			this.setSolid();
		}; EntranceGate.prototype = Object.create(GameObject.prototype);

		return EntranceGate;
	})();

	var ExitGate = (function () {

		function ExitGate() {
			GameObject.call(this);
			this.addTag("ExitGate")
			this.setImage(document.getElementById("door"));
			this.setSize(40, 45);
			this.setPosition(40, 40);
			this.setSolid();
		}; ExitGate.prototype = Object.create(GameObject.prototype);

		return ExitGate;
	})();

	var Loot = (function () {

		function Loot() {
			GameObject.call(this);
			this.addTag("Loot");
			this.setImage(media['loot'][Quick.random(2)]);
			this.setSize(20, 20);
			this.setPosition(
				100 + Quick.random(Quick.getCanvasWidth()-200),
				60 + Quick.random(Quick.getCanvasHeight()-160)
			);
			this.setSolid();
		}; Loot.prototype = Object.create(GameObject.prototype);

		return Loot;
	})();

	main();
})();