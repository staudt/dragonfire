(function () {
	"use strict";

	var CommandEnum = com.dgsprb.quick.CommandEnum;
	var Quick = com.dgsprb.quick.Quick;
	var GameObject = com.dgsprb.quick.GameObject;
	var Scene = com.dgsprb.quick.Scene;

	var score = 0;
	var lives = 3;

	function main() {
		Quick.setName("Dragonfire");
		Quick.setNumberOfLayers(2);
		Quick.init(function () { return new GameScene() });
	}

	var GameScene = (function () {

		function GameScene() {
			Scene.call(this);
			var background = new Background();
			this.add(background);
			this.add(new Bridge());
			this.add(new River());
			this.add(new Tower(true));
			this.add(new Tower(false));
			var player = new Player();
			this.add(player);
			this.createFlames();
		}; GameScene.prototype = Object.create(Scene.prototype);

		GameScene.prototype.getNext = function () {
			return new GameScene();
		}

		GameScene.prototype.createFlames = function() {
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

		GameScene.prototype.flameDied = function(isTop) {
			this.activeFlames--;
			if (this.activeFlames<=0) {
				this.createFlames();
			}
		}

		return GameScene;
	})();

	var Background = (function () {

		function Background() {
			GameObject.call(this);
			this.setColor("Purple");
			this.setSize(Quick.getCanvasWidth(), Quick.getCanvasHeight());
		}; Background.prototype = Object.create(GameObject.prototype);

		return Background;
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

	var Player = (function () {
		
		var SPEED = 9;
		
		function Player() {
			GameObject.call(this);
			this.controller = Quick.getController();
			this.setColor("White");
			this.jumping = false;
			this.setSize(8, 20);
			this.setSolid();
			this.setPosition(Quick.getCanvasWidth()-this.getWidth()-70, Quick.getCanvasHeight()/3*2-20);
			this.setBoundary(Quick.getBoundary());
			this.setAccelerationY(2);
		}; Player.prototype = Object.create(GameObject.prototype);

		Player.prototype.update = function () {
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

		Player.prototype.onCollision = function(obj) {
			if(obj.hasTag("fire")) {
				this.getScene().expire();
				lives--;
			} else if (obj.hasTag("LeftTower")) {
				score++;
				this.getScene().expire();
			} else if (obj.hasTag("Bridge")) {
				this.stop();
				this.setBottom(obj.getTop());
				this.jumping = false;
			}
		};

		Player.prototype.offBoundary = function(rct) {
			this.stop();
		};

		return Player;
	})();

	var Flame = (function () {

		function Flame(isTop, speed) {
			GameObject.call(this);
			this.isTop = isTop;
			this.setColor("Red");
			this.setSize(14, 6);
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

	main();

})();
