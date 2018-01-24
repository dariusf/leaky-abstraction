var Interpreter = (function() {

	var player, game, fireballGroup;
	var numberOfScriptsToLoad = 4;
	var scripts = [];
	var selectedScript = -1;

	var interpreterRunning = false;
	var asyncRunning = false;

	function loadScripts(game) {
		for (var i = 0; i < numberOfScriptsToLoad; i++) {
			game.load.text('script' + i, 'assets/scripts/script' + i + '.js');
		}
	}

	function init(gameInstance, p, fireballs) {
		game = gameInstance;
		player = p;
		fireballGroup = fireballs;

		for (var i = 0; i < numberOfScriptsToLoad; i++) {
			scripts[i] = game.cache.getText('script' + i);
		}
	}

	function shove(x, y) {
		this.body.velocity.x += x;
		this.body.velocity.y += y;
	}

	function say(msg) {

		var style = {
			font: "26px Arial",
			fill: "#000000",
			align: "center"
		};
		var text = game.add.text(player.x, player.y - 40, msg, style);
		text.anchor.set(0.5);

		var tween = game.add.tween(text);
		tween.to({
			y: player.y - 160,
			alpha: 0
		}, 1000, null);
		tween.onComplete.add(function() {
			text.destroy();
		}, this);
		tween.start();
	}

	function executeScriptOn(target) {

		target = target || {};

		if (interpreterRunning || asyncRunning) {
			say('the previous instance is still running');
			return; // only 1 instance runs at a time
		}
		interpreterRunning = true;

		var interpreter = new Tailspin.Interpreter();

		interpreter.global.me = {
			get x() {
				return player.x;
			},
			get y() {
				return player.y;
			},
			focus: {
				get x() {
					return game.input.mousePointer.worldX;
				},
				get y() {
					return game.input.mousePointer.worldY;
				}
			},
			say: say,
			spells: {
				fire: {
					fireball: function(x, y) {
						var fireball = fireballGroup.create(x, y, 'balls', [0]);
						fireball.anchor.setTo(0.5, 0.5);
						fireball.body.gravity.y = 300;
						fireball.body.bounce.x = fireball.body.bounce.y = 0.7 + Math.random() * 0.2;
						fireball.body.collideWorldBounds = true;

						return {
							shove: function() {
								shove.apply(fireball, arguments);
							}
						};
					}
				}
			}
		};
		interpreter.global.__defineGetter__("x", function() {
			return target.x
		});
		interpreter.global.__defineGetter__("y", function() {
			return target.y
		});
		// interpreter.global.x = target.x;
		// interpreter.global.y = target.y;
		interpreter.global.shove = function(x, y) {
			shove.apply(target, arguments);
			return interpreter.global;
		};
		interpreter.global.continuously = function(f) {
			asyncRunning = true;
			function run() {
				var continueRunning = f();
				asyncRunning = asyncRunning && continueRunning;
				if (asyncRunning && continueRunning) {
					setTimeout(run, 100);
				}
			}
			run();

			return interpreter.global;
		};

		// console = {
		//     log: function(msg) {
		//         consoleLog(msg, 'log');
		//     }
		// };

		// Callback functions for evaluation.
		function returnFn(result) {
			console.log("output", JSON.stringify(result));
			interpreterRunning = false;
		}

		function errorFn(result) {
			console.log("ERROR:", result);
			interpreterRunning = false;
			interpreter.global.me.say('ouch! that didn\'t work');
		}

		// Create an evaluation context that describes the how the code is to be executed.
		var x = interpreter.createExecutionContext();

		// Asynchronous running is prefered, so that tailspin execution does not block the browser.
		x.asynchronous = true;

		// A very simple control function that outputs the node line number and value.
		x.control = function(n, x, next, prev) {
			// var value = "";
			// if (typeof n.value === "string" || typeof n.value === "number") {
			//     value = " '" + n.value + "'";
			// }
			// consoleLog(n.lineno + ": " + Tailspin.Definitions.tokens[n.type] + value);

			// Continue execution.
			if (interpreterRunning) {
				next(prev);
			}
		};

		// Run the code.
		interpreter.evaluateInContext($('#code').val(), 'source', 0, x, returnFn, errorFn, null);
	}

	function kill() {
		interpreterRunning = false;
		asyncRunning = false;
	}

	function getScriptCount() {
		return scripts.length;
	}

	function selectScript(index) {
		selectedScript = index;
		return scripts[index];
	}

	function updateSelectedScript() {
		if (selectedScript >= 0) {
			scripts[selectedScript] = $('#code').val();
		}
	}

	return {
		init: init,
		executeScriptOn: executeScriptOn,
		getScriptCount: getScriptCount,
		selectScript: selectScript,
		updateSelectedScript: updateSelectedScript,
		kill: kill,
		loadScripts: loadScripts,
	};
})();