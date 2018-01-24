var GUI = (function() {
	var game, guiGroup, stars;
	var scoreText;
	var drag;

	var scriptButtons = [];

	var buttonGroup;

	function init(gameInstance, group, starsGroup) {
		game = gameInstance;
		guiGroup = group;
		stars = starsGroup;

		buttonGroup = game.add.group();
		guiGroup.add(buttonGroup);

		initDrag();

		initScoreText();

		initDarken();
		RepoPanel.init();

		$('#code').bind('input propertychange', Interpreter.updateSelectedScript);
	}

	function initDrag() {

		drag = {
			sprite: null,
			ox: 0,
			oy: 0,
			select: function(sprite) {
				this.sprite = sprite;
				this.ox = sprite.cameraOffset.x;
				this.oy = sprite.cameraOffset.y;
			},
			update: function() {
				if (this.sprite === null) return;

				var x = game.input.mousePointer.worldX;
				var y = game.input.mousePointer.worldY;

				this.sprite.cameraOffset.setTo(x, y);

				stars.forEach(function(star) {
					if (game.physics.arcade.overlap(this.sprite, star, null, null, this)) {
						star.tint = 0x00ff00;
					} else {
						star.tint = 0xffffff;
					}
				}, this);
			},
			done: function() {
				var closest = null;
				var sofar = Infinity;

				// pick the target closest to the dragged object
				stars.forEach(function(star) {
					star.tint = 0xffffff;
					if (game.physics.arcade.overlap(this.sprite, star, null, null, this)) {
						var dist = game.physics.arcade.distanceBetween(star, this.sprite);
						if (dist < sofar) {
							dist = sofar;
							closest = star;
						}
					}
				}, this);

				var x = this.sprite.cameraOffset.x;
				var y = this.sprite.cameraOffset.y;

				this.sprite.cameraOffset.setTo(this.ox, this.oy);
				this.sprite = null;

				var PANEL_WIDTH = 200;
				var PANEL_HEIGHT = 300;

				var leftBox = x < 800 - PANEL_WIDTH || y > 600 - PANEL_HEIGHT;

				console.log('leftBox', leftBox, x, y);

				if (!leftBox) return;

				if (!closest) {
					// console.log('closest is null!');
					Interpreter.executeScriptOn(null);
				}
				else {
					Interpreter.executeScriptOn(closest);
				}
			}
		};
	}

	function createScriptButton(group, x, y, index) {
		var button = group.create(x, y, 'diamond');
		button.fixedToCamera = true;
		button.inputEnabled = true;
		button.anchor.setTo(0.5, 0.5);
		game.physics.arcade.enable(button);
		button.enableBody = true;
		scriptButtons.push(button);
		
		// TODO: cannot set first param to true. might be a phaser bug
		// button.input.enableDrag(false, true);

		button.events.onInputDown.add(function(sprite, mouse) {
			drag.select(sprite);
			Main.pauseObjects();
			darken();
			$('#code').val(Interpreter.selectScript(index));
		}, this);
		button.events.onInputUp.add(function(sprite, mouse) {
			drag.done();
			Main.unpauseObjects();
			lighten();
		}, this);

		return button;
	}

	function initScoreText() {
		scoreText = game.add.text(16, 16, 'score: 0', {
			fontSize: '32px',
			fill: '#000'
		});
		guiGroup.add(scoreText);
	}

	function updateScore(newScore) {
		scoreText.text = 'Score: ' + newScore;
	}

	function update() {
		drag.update();
	}

	var darkenSprite;
	var currentTween = null;

	function initDarken () {
		darkenSprite = game.add.sprite(0, 0, 'black');
		darkenSprite.alpha = 0;
		darkenSprite.scale.setTo(800, 600);
		guiGroup.add(darkenSprite);
	}

	function darken() {
		if (currentTween) {
			currentTween.stop();
		}
		currentTween = game.add.tween(darkenSprite);
		currentTween.to({alpha: 0.3}, 300, null);
		currentTween.onComplete.add(function() {currentTween = null;}, this);
		currentTween.start();
	}

	function lighten() {
		if (currentTween) {
			currentTween.stop();
		}
		currentTween = game.add.tween(darkenSprite);
		currentTween.to({alpha: 0}, 300, null);
		currentTween.onComplete.add(function() {currentTween = null;}, this);
		currentTween.start();
	}

	var RepoPanel = {

		init: function() {
			var panel = buttonGroup.create(800 - 200, 0, 'panel');
			panel.fixedToCamera = true;
			panel.inputEnabled = true;

			this.refresh();
		},
		refresh: function () {

			// remove all except the pane
			buttonGroup.removeBetween(1, null, true);

			var margin = 15;
			var height = 0;
			var count = Interpreter.getScriptCount();

			var PANEL_WIDTH = 200;
			var PANEL_HEIGHT = 300;
			var BUTTON_HEIGHT = 28;
			var BUTTON_WIDTH = 32;

			while (count > 0) {
				for (var i = 0; i < PANEL_WIDTH / BUTTON_WIDTH; i++) {
					var index = Interpreter.getScriptCount() - count;
					var button = createScriptButton(buttonGroup,
						800 - PANEL_WIDTH + margin*2 + i * BUTTON_WIDTH + BUTTON_WIDTH/2,
						margin + height + BUTTON_HEIGHT/2,
						index);

					count--;
					if (count <= 0) break;
				}
				height += BUTTON_HEIGHT + margin;
			}
		}
	};

	return {
		init: init,
		updateScore: updateScore,
		update: update,
		darken: darken,
		lighten: lighten,
	};
})();