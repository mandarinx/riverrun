module.exports = new Phaser.State();

var config = require('config');

function Point(x, y) {
    this.x = x;
    this.y = y;
    this.px = 0;
    this.py = 0;
    this.width = 3;
}

Point.prototype = {
    toScreenCoords: function(game) {
        this.px = ((this.x + 1) / 2) * game.world.bounds.width;
        this.py = game.world.bounds.height - (((this.y + 1) / 2) * game.world.bounds.height);
    },
    postUpdate: function() {}
};

var river_joints = [];
var graphics = null;
var cursors = null;
var game = null;
var input = false;
var dir = 0;
var speed = 0.005;
var head = new Point(0, -1);
var break_point = 0.05;
var river_width = 3;
var head_sprite = null;

module.exports.create = function() {
    var game_config = config.get('game');
    game = this.game;

    cursors = game.input.keyboard.createCursorKeys();

    game.world.setBounds(0, 0, game.width, game.height*2);
    game.add.tileSprite(0, 0,
                        game.world.bounds.width,
                        game.world.bounds.height, 'grid');


    graphics = game.add.graphics(0, 0);

    head.toScreenCoords(game);

    head_sprite = game.add.sprite(head.px, head.py, 'pink');
    head_sprite.anchor.set(0.5, 0.5);

    game.camera.follow(head_sprite);
    game.camera.deadzone = new Phaser.Rectangle(0,
                                                game.height * 0.75,
                                                game.width,
                                                game.height * 0.25);
    game.camera.y = game.world.bounds.height;
};

module.exports.update = function() {
    input = false;
    dir = 0;

    if (cursors.left.isDown ||
        cursors.right.isDown) {
        input = true;
        dir = cursors.left.isDown ? -1 : 1;
    }

    head.x = input ? head.x + (0.005 * dir) : head.x * 0.99;
    head.y += speed;

    if (game.camera.y === 0) {
        head.y = -0.75;
        game.camera.y = game.world.bounds.height;
    }

    head.toScreenCoords(game);
    head_sprite.x = head.px;
    head_sprite.y = head.py;

    graphics.clear();

    graphics.beginFill(0x000000, 1);
    graphics.drawRect(0, 0, game.width, game.height);
    graphics.endFill();


    graphics.beginFill(0x00ff00, 1);
    graphics.drawCircle(head.px, head.py, 3);
    graphics.endFill();

    if (river_joints.length === 0) {
        if (head.y >= -1 + break_point) {
            river_joints.push(new Point(head.x, head.y));
        }
    } else {
        if (distance(head, river_joints[river_joints.length-1]) > break_point) {
            river_joints.push(new Point(head.x, head.y));
        }
    }

    if (river_joints.length > 0) {

        if (river_joints[0].y < -1) {
            river_joints.shift();
        }

        graphics.beginFill(0xff0000, 1);

        if (cursors.up.isDown) {
            river_width += 0.5;
            if (river_width >= 32) {
                river_width = 32;
            }
        } else {
            river_width -= 1;
            if (river_width <= 3) {
                river_width = 3;
            }
        }
        river_joints[river_joints.length-1].width = river_width;

        river_joints.forEach(function(joint) {
            joint.toScreenCoords(game);
            graphics.drawCircle(joint.px, joint.py, joint.width);
        });

        graphics.endFill();
    }
};

// module.exports.render = function() {
//     var zone = game.camera.deadzone;

//     game.context.fillStyle = 'rgba(0,255,0,0.2)';
//     game.context.fillRect(zone.x, zone.y, zone.width, zone.height);
// };

function distance(point_a, point_b) {
    return Math.sqrt(Math.pow(point_b.x - point_a.x, 2) + Math.pow(point_b.y - point_a.y, 2));
}
