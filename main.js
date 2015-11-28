(function () {
	"use strict";

	var CommandEnum = com.dgsprb.quick.CommandEnum;
	var Quick = com.dgsprb.quick.Quick;
	var GameObject = com.dgsprb.quick.GameObject;
	var Scene = com.dgsprb.quick.Scene;

	var player;
	var score = 0;
	var lifes = 3;

	function main() {
		Quick.setName("Dragonfire");
		Quick.setNumberOfLayers(2);
		Quick.init(function () { return new BridgeScene() });
	}

	var BridgeScene = (function () {

		function BridgeScene() {
			Scene.call(this);
			this.completed = false;
			var background = new BridgeBackground();
			this.add(background);
			this.add(new Bridge());
			this.add(new River());
			this.add(new Tower(true));
			this.add(new Tower(false));
			player = new BridgePlayer();
			this.add(player);
			this.createFlames();
		}; BridgeScene.prototype = Object.create(Scene.prototype);

		BridgeScene.prototype.getNext = function () {
			if (this.completed) {
				return new CastleScene();
			} else {
				return new BridgeScene();
			}
		}

		BridgeScene.prototype.success = function () {
			this.completed = true;
			this.expire();
		}

		BridgeScene.prototype.createFlames = function() {
			var speed1 = 6 + Quick.random(5) + score;
			var speed2 = 6 + Quick.random(5) + score;
			while (Math.abs(speed1-speed2)<3) {
				speed2 = 6 + Quick.random(5) + score;
			}
			//for (var i=0; i<score+1;i++) {
				this.add(new Flame(true, speed1));
				this.add(new Flame(false, speed2));
			//}
			this.activeFlames=2; //*(score+1);
		}

		BridgeScene.prototype.flameDied = function(isTop) {
			this.activeFlames--;
			if (this.activeFlames<=0) {
				this.createFlames();
			}
		}

		return BridgeScene;
	})();

	var BridgePlayer = (function () {
		
		var SPEED = 9;
		
		function BridgePlayer() {
			GameObject.call(this);
			this.controller = Quick.getController();
			this.setColor("White");
			this.jumping = false;
			this.setSize(8, 22);
			this.setSolid();
			this.setPosition(Quick.getCanvasWidth()-this.getWidth()-70, Quick.getCanvasHeight()/3*2-20);
			this.setBoundary(Quick.getBoundary());
			this.setAccelerationY(2);
		}; BridgePlayer.prototype = Object.create(GameObject.prototype);

		BridgePlayer.prototype.update = function () {
			if (this.controller.keyDown(CommandEnum.DOWN)) {
				var feetY = this.getBottom();
				this.setHeight(10);
				this.setBottom(feetY);
			} else {
				var feetY = this.getBottom();
				this.setHeight(20);
				this.setBottom(feetY);

				if (this.controller.keyDown(CommandEnum.LEFT) && this.getLeft() > 0) {
					this.moveX(-SPEED);
				} else if (this.controller.keyDown(CommandEnum.RIGHT) && this.getRight() < Quick.getCanvasWidth()) {
					this.moveX(SPEED);
				}
			}
			if (this.controller.keyPush(CommandEnum.A) && !this.jumping) {
				this.setSpeedY(-10);
				this.jumping = true;
			}
		};

		BridgePlayer.prototype.onCollision = function(obj) {
			if(obj.hasTag("fire")) {
				this.getScene().expire();
				lifes--;
			} else if (obj.hasTag("LeftTower")) {
				this.getScene().success();
			} else if (obj.hasTag("Bridge")) {
				this.stop();
				this.setBottom(obj.getTop());
				this.jumping = false;
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
			this.setColor("Purple");
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

		return Tower;
	})();

	var Flame = (function () {

		function Flame(isTop, speed) {
			GameObject.call(this);
			this.isTop = isTop;
			this.setColor("Red");
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
			this.completed = false;
			this.lootItems = 8;
			var background = new CastleBackground();
			this.add(background);
			player = new CastlePlayer();
			this.add(player);
			this.add(new CastleDragon());
			this.add(new EntranceGate());
			for(var i=0; i<this.lootItems;i++) {
				this.add(new Loot());
			}
		}; CastleScene.prototype = Object.create(Scene.prototype);

		CastleScene.prototype.getNext = function () {
			if (this.completed) {
				return new BridgeScene();
			} else {
				return new CastleScene();
			}
		}

		CastleScene.prototype.success = function () {
			this.completed = true;
			score++;
			this.expire();
		}

		CastleScene.prototype.caughtLoot = function () {
			this.lootItems--;
			if (this.lootItems<=0) {
				this.add(new ExitGate());
			}
		}

		return CastleScene;
	})();

	var CastlePlayer = (function () {
		
		var SPEED = 13;
		
		function CastlePlayer() {
			GameObject.call(this);
			this.controller = Quick.getController();
			this.hidden = false;
			this.setColor("White");
			this.setSize(8, 20);
			this.setSolid();
			this.startX = Quick.getCanvasWidth()-this.getWidth()-70;
			this.startY = Quick.getCanvasHeight()/3*2-20;
			this.setPosition(this.startX, this.startY);
			this.setBoundary(Quick.getBoundary());
		}; CastlePlayer.prototype = Object.create(GameObject.prototype);

		CastlePlayer.prototype.update = function () {
			if (this.hidden) {
				if (this.controller.keyDown(CommandEnum.LEFT) && this.getLeft() > 0) {
					this.setVisible(true);
					this.hidden = false;
					this.setPosition(this.startX, this.startY);
				}
			}

			if (this.controller.keyDown(CommandEnum.LEFT) && this.getLeft() > 0) {
				this.moveX(-SPEED);
			} else if (this.controller.keyDown(CommandEnum.RIGHT) && this.getRight() < Quick.getCanvasWidth()) {
				this.moveX(SPEED);
			}

			if (this.controller.keyDown(CommandEnum.UP) && this.getTop() > 0) {
				this.moveY(-SPEED);
			} else if (this.controller.keyDown(CommandEnum.DOWN) && this.getBottom() < Quick.getCanvasHeight()) {
				this.moveY(SPEED);
			}
		};

		CastlePlayer.prototype.onCollision = function(obj) {
			if (obj.hasTag("Hot")) {
				lifes--;
				this.setVisible(false);
				this.hidden = true;
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
		};

		CastlePlayer.prototype.offBoundary = function(rct) {
			this.stop();
		};

		return CastlePlayer;
	})();

	var CastleDragon = (function () {
		var SPEED = 4;
		
		function CastleDragon() {
			GameObject.call(this);
			this.addTag("Hot");
			this.turnedLeft = false;
			this.setColor("White");
			this.setSize(130, 46);
			this.setPosition(60, Quick.getCanvasHeight()-60);
			this.setSolid();
		}; CastleDragon.prototype = Object.create(GameObject.prototype);

		CastleDragon.prototype.update = function () {
			if (player.getCenterX() > this.getRight()) {
				this.moveX(SPEED + score);
				this.turnedLeft = false;
			} else {
				this.moveX(-SPEED - score);
				this.turnedLeft = true;
			}

			if (Quick.random(100+(score*5))>95) {
				this.getScene().add(
					new DragonFireball(
						this.turnedLeft ? this.getLeft() : this.getRight(),
						this.getCenterY()
					)
				);
			}
		};

		return CastleDragon;
	})();

	var DragonFireball = (function () {
		
		function DragonFireball(x, y) {
			GameObject.call(this);
			this.addTag("Hot");
			this.controller = Quick.getController();
			this.setColor("Red");
			this.setSize(20, 20);
			this.setPosition(x, y);
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
			this.setColor("Black");
			this.setSize(Quick.getCanvasWidth(), Quick.getCanvasHeight());
		}; CastleBackground.prototype = Object.create(GameObject.prototype);

		return CastleBackground;
	})();

	var EntranceGate = (function () {

		function EntranceGate() {
			GameObject.call(this);
			this.addTag("EntranceGate");
			this.setColor("Orange");
			this.setSize(40, 50);
			this.setPosition(Quick.getCanvasWidth()-60, Quick.getCanvasHeight()-180);
			this.setSolid();
		}; EntranceGate.prototype = Object.create(GameObject.prototype);

		return EntranceGate;
	})();

	var ExitGate = (function () {

		function ExitGate() {
			GameObject.call(this);
			this.addTag("ExitGate")
			this.setColor("Orange");
			this.setSize(40, 50);
			this.setPosition(40, 40);
			this.setSolid();
		}; ExitGate.prototype = Object.create(GameObject.prototype);

		return ExitGate;
	})();

	var Loot = (function () {

		function Loot() {
			GameObject.call(this);
			this.addTag("Loot");
			this.setColor("Yellow");
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