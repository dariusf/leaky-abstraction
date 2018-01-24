var Interpreter = (function() {

  var player, game, fireballGroup;
  var scripts = [
  `this.shove(this.x - me.x, this.y - me.y);`,
  `continuously(function() {
  me.say("hi!");
  return true;
});`,
   `me.spells.fire.fireball(me.x, me.y).shove(me.focus.x - me.x, me.focus.y - me.y);`,
   `var count = 0;
continuously(function() {
  me.spells.fire.fireball(me.x, me.y).shove(me.focus.x - me.x, me.focus.y - me.y);
  return count++ < 21;
});`
  ];

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

    // for (var i = 0; i < numberOfScriptsToLoad; i++) {
    //  scripts[i] = game.cache.getText('script' + i);
    // }
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

    let run = (function(code) {

      let me = {
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

      function continuously(f) {
        asyncRunning = true;
        function run() {
          var continueRunning = f();
          asyncRunning = asyncRunning && continueRunning;
          if (asyncRunning && continueRunning) {
            setTimeout(run, 100);
          }
        }
        run();

        // return interpreter.global;
      }

      eval(code);
    }).bind({
      get x() {
        return target.x
      },
      get y() {
        return target.y
      },
      shove(x, y) {
        shove.apply(target, arguments);
        return this;
      },
    });

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

    run($('#code').val());
  }

  function kill() {
    if (interpreterRunning) {
      interpreterRunning = false;
      asyncRunning = false;
      say('instance stopped');
    }
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
  };
})();