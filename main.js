(function () {
	"use strict";

	var CommandEnum = com.dgsprb.quick.CommandEnum;
	var Quick = com.dgsprb.quick.Quick;
	var GameObject = com.dgsprb.quick.GameObject;
	var Scene = com.dgsprb.quick.Scene;
	var gameScene;

	var SPEED = 8;

	function genFire(i) {
		var fire = new GameObject();
		fire.setColor("Red");
		fire.setSize(20, 6);
		fire.setPosition(0, 
			Quick.getCanvasHeight()/3*2-
				(i==0 ? 24 : 10));
		fire.setSolid();
		fire.setSpeedX(7 + Quick.random(4));
		fire.addTag("fire");
		fire.addTag(i==0 ? "top" : "bottom");
		fire.setBoundary(Quick.getBoundary());
		fire.setDelegate({
			"offBoundary": function(rct) {
				genFire(fire.hasTag("top") ? 0 : 1);
				fire.expire();
			}
		});
		gameScene.add(fire);
	}

	function main() {
		Quick.setName("Dragonfire");
		gameScene = new Scene();
		Quick.init(function () { return gameScene });
		var background = new GameObject();
		background.setColor("Purple");
		background.setHeight(Quick.getCanvasHeight());
		background.setWidth(Quick.getCanvasWidth());
		gameScene.add(background);

		var bridge = new GameObject();
		bridge.setColor("Black");
		bridge.setSize(Quick.getCanvasWidth(), 30);
		bridge.setPosition(0, Quick.getCanvasHeight()/3*2);
		bridge.setSolid();
		gameScene.add(bridge);

		var player = new GameObject();
		player.controller = Quick.getController();
		player.setColor("White");
		player.jumping = false;
		player.setSize(8, 20);
		player.setSolid();
		player.setPosition(Quick.getCanvasWidth()-player.getWidth(), Quick.getCanvasHeight()/3*2-20);

		player.setDelegate({
			"update" : function() {
				if (player.controller.keyDown(CommandEnum.DOWN)) {
					var feetY = player.getBottom();
					player.setHeight(10);
					player.setBottom(feetY);
				} else {
					var feetY = player.getBottom();
					player.setHeight(20);
					player.setBottom(feetY);

					if (player.controller.keyDown(CommandEnum.LEFT) && player.getLeft() > 0) {
						player.moveX(-SPEED);
					} else if (player.controller.keyDown(CommandEnum.RIGHT) && player.getRight() < Quick.getCanvasWidth()) {
						player.moveX(SPEED);
					}
				}

				if (player.controller.keyPush(CommandEnum.A) && !player.jumping) {
					player.setSpeedY(-12);
					player.setAccelerationY(2);
					player.jumping = true;
				}
			},
			"onCollision": function(obj) {
				if(obj.hasTag("fire")) {
					player.setColor("Red");
				} else {
					player.stop();
					player.setBottom(obj.getTop());
					player.jumping = false;
				}
			}
		});
		gameScene.add(player);
		
		genFire(0);
		genFire(1);
	}

	main();

})();
