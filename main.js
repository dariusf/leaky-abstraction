var Main = (function() {
    var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game', {
        preload: preload,
        create: create,
        update: update
    });

    function preload() {
        game.load.image('sky', 'assets/sky.png');
        game.load.image('ground', 'assets/platform.png');
        game.load.image('star', 'assets/star.png');
        game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
        game.load.image('diamond', 'assets/diamond.png');
        game.load.image('black', 'assets/black.png');
        game.load.image('panel', 'assets/panel.png');
        game.load.image('panel_buttons', 'assets/panel_buttons.png');
        game.load.spritesheet('balls', 'assets/balls.png', 17, 17);
        game.load.spritesheet('baddie', 'assets/baddie.png', 32, 32);
    }

    var player;
    var cursors;
    var score = 0;

    var platformsGroup, starsGroup, fireballGroup;
    var guiGroup;

    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.add.sprite(0, 0, 'sky');

        createPlatforms();
        createPlayer();
        createStars();
        createOtherStuff();

        initControls();

        guiGroup = game.add.group();
        Interpreter.init(game, player, fireballGroup);
        GUI.init(game, guiGroup, starsGroup);
    }

    function initControls() {
        cursors = game.input.keyboard.createCursorKeys();
    }

    function createEmitter (x, y) {
        var emitter = game.add.emitter(x, y, 20);
        emitter.makeParticles('balls', [0]);
        emitter.minParticleSpeed.setTo(-200, -200);
        emitter.maxParticleSpeed.setTo(200, 200);
        emitter.gravity = -1000;
        emitter.start(false, 250, 35);
        return emitter;
    }

    // function Entity (sprite, others) {
    //     this.sprite = sprite;
    //     this.others = others || [];

    //     this.others.forEach(function (other) {
    //         other.x = sprite.x;
    //         other.y = sprite.y;
    //     });
    // }
    // Entity.prototype = {
    //     get x() {return this.sprite.x;},
    //     get y() {return this.sprite.y;},
    //     set x(x) {this.sprite.x = x;},
    //     set y(y) {this.sprite.y = y;}
    // };

    function CompoundSprite (sprite, emitter) {
        Phaser.Group.call(this, game);
        this.add(sprite);
        this.add(emitter);
    }
    CompoundSprite.prototype = Object.create(Phaser.Group.prototype);
    CompoundSprite.prototype.constructor = CompoundSprite;

    function createOtherStuff () {
        fireballGroup = game.add.group();
        fireballGroup.enableBody = true;
    }

    function createStars() {
        starsGroup = game.add.group();
        starsGroup.enableBody = true;

        for (var i = 0; i < 12; i++) {
            var star = game.add.sprite(i * 70, 0, 'star');
            starsGroup.add(star);
            star.body.collideWorldBounds = true;
            star.body.gravity.y = 300;
            star.body.bounce.x = star.body.bounce.y = 0.7 + Math.random() * 0.2;
        }
    }

    function createPlayer() {
        player = game.add.sprite(32, game.world.height - 150, 'dude');
        game.physics.arcade.enable(player);
        player.body.bounce.y = 0.2;
        player.body.gravity.y = 300;
        player.body.collideWorldBounds = true;
        player.anchor.setTo(0.5, 0.5);
        player.animations.add('left', [0, 1, 2, 3], 10, true);
        player.animations.add('right', [5, 6, 7, 8], 10, true);
    }

    function createPlatforms() {
        platformsGroup = game.add.group();
        platformsGroup.enableBody = true;

        var ground = platformsGroup.create(0, game.world.height - 64, 'ground');
        ground.scale.setTo(2, 2);
        ground.body.immovable = true;

        var ledge = platformsGroup.create(400, 400, 'ground');
        ledge.body.immovable = true;
        ledge = platformsGroup.create(-150, 250, 'ground');
        ledge.body.immovable = true;
    }

    function update() {

        GUI.update();

        game.physics.arcade.collide(player, platformsGroup);
        game.physics.arcade.collide(starsGroup, platformsGroup);
        game.physics.arcade.collide(fireballGroup, platformsGroup);
        game.physics.arcade.collide(player, fireballGroup);

        game.physics.arcade.overlap(player, starsGroup, collectStar, null, this);

        player.body.velocity.x = 0;

        if (cursors.left.isDown || game.input.keyboard.isDown(Phaser.Keyboard.A)) {
            player.body.velocity.x = -150;
            player.animations.play('left');
        } else if (cursors.right.isDown || game.input.keyboard.isDown(Phaser.Keyboard.D)) {
            player.body.velocity.x = 150;
            player.animations.play('right');
        } else {
            player.animations.stop();
            player.frame = 4;
        }

        //  Allow the player to jump if they are touching the ground.
        if ((cursors.up.isDown || game.input.keyboard.isDown(Phaser.Keyboard.W)) && player.body.touching.down) {
            player.body.velocity.y = -350;
        }

        if (game.input.keyboard.isDown(Phaser.Keyboard.ESC)) {
            Interpreter.kill();
        }
    }

    function collectStar(player, star) {
        star.kill();

        score += 10;
        GUI.updateScore(score);
    }

    function pauseObjects() {
        player.body.moves = false;
        starsGroup.forEach(function(star) {
            star.body.moves = false;
        }, this);
        fireballGroup.forEach(function(star) {
            star.body.moves = false;
        }, this);
    }

    function unpauseObjects() {
        player.body.moves = true;
        starsGroup.forEach(function(star) {
            star.body.moves = true;
        }, this);
        fireballGroup.forEach(function(star) {
            star.body.moves = true;
        }, this);
    }

    return {
        pauseObjects: pauseObjects,
        unpauseObjects: unpauseObjects,
    };
})();