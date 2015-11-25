(function () {
	"use strict";

	var CommandEnum = com.dgsprb.quick.CommandEnum;
	var Quick = com.dgsprb.quick.Quick;
	var GameObject = com.dgsprb.quick.GameObject;
	var Scene = com.dgsprb.quick.Scene;

	function main() {
		Quick.setName("Dragonfire");
		Quick.init(function () { return new GameScene() });
	}

	var GameScene = (function () {

		function GameScene() {
			Scene.call(this);
			var background = new Background();
			this.add(background);
			this.add(new Bridge());
			this.add(new Tower());
			var player = new Player();
			this.add(player);
			this.add(new Flame(true));
			this.add(new Flame(false));
			this.activeFlames = 2;
		}; GameScene.prototype = Object.create(Scene.prototype);

		GameScene.prototype.flameDied = function(isTop) {
			this.activeFlames--;
			if (this.activeFlames<=0) {
				this.add(new Flame(true));
				this.add(new Flame(false));
				this.activeFlames=2;
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
		}; Bridge.prototype = Object.create(GameObject.prototype);

		return Bridge;

	})();

	var Tower = (function () {
		
		function Tower() {
			GameObject.call(this);
			this.setColor("Black");
			this.setSize(60, Quick.getCanvasHeight()/6*4);
			this.setPosition(0, Quick.getCanvasHeight()/6*2);
			this.setSolid();
		}; Tower.prototype = Object.create(GameObject.prototype);

		return Tower;

	})();

	var Player = (function () {
		
		var SPEED = 8;
		
		function Player() {
			GameObject.call(this);
			this.controller = Quick.getController();
			this.setColor("White");
			this.jumping = false;
			this.setSize(8, 20);
			this.setSolid();
			this.setPosition(Quick.getCanvasWidth()-this.getWidth(), Quick.getCanvasHeight()/3*2-20);
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
				this.setAccelerationY(2);
				this.jumping = true;
			}
		};

		Player.prototype.onCollision = function(obj) {
			if(obj.hasTag("fire")) {
				this.setColor("Red");
			} else {
				this.stop();
				this.setBottom(obj.getTop());
				this.jumping = false;
			}
		};

		return Player;

	})();

	var Flame = (function () {

		function Flame(isTop) {
			GameObject.call(this);
			this.isTop = isTop;
			this.setColor("Red");
			this.setSize(20, 6);
			this.setPosition(
				-Quick.random(90), 
				Quick.getCanvasHeight()/3*2-(isTop ? 22 : 10));
			this.setSolid();
			this.setSpeedX(6 + Quick.random(5));
			this.addTag("fire");
			var boundaries = Quick.getBoundary();
			boundaries.increaseWidth(200);
			boundaries.setLeft(-100);
			this.setBoundary(boundaries);
		}; Flame.prototype = Object.create(GameObject.prototype);

		Flame.prototype.offBoundary = function(rct) {
			this.getScene().flameDied(this.isTop);
			this.expire();
		};

		return Flame;

	})();


	main();

})();