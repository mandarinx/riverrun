module.exports = new Phaser.State();

var config = require('config');

function Point(x, y) {
    this.x = x;
    this.y = y;
}

var river_joints = [];
var graphics = null;
var cursors = null;
var game = null;
var input = false;
var dir = 0;
var speed = 0.005;
var head = new Point(0, 0);
var break_point = 0.1;
var river_width = 1;

module.exports.create = function() {
    var game_config = config.get('game');
    game = this.game;

    cursors = game.input.keyboard.createCursorKeys();
    game.stage.backgroundColor = game_config.background_color;

    graphics = game.add.graphics(0, 0);

    river_joints.push(new Point(0, -1));
    river_joints.push(new Point(0, 0));
};

module.exports.update = function() {
    input = false;
    dir = 0;

    if (cursors.left.isDown ||
        cursors.right.isDown) {
        input = true;
        dir = cursors.left.isDown ? -1 : 1;
    }

    river_joints.forEach(function(joint) {
        joint.y -= speed;
    });

    for (var i=river_joints.length-1; i>=0; i--) {
        var joint = river_joints[i];
        if (joint.y < -1) {
            river_joints.shift();
        }
    }

    head.x = input ? head.x + (0.005 * dir) : head.x * 0.99;

    if (distance(head, river_joints[river_joints.length-1]) > break_point) {
        river_joints.push(new Point(head.x, head.y));
    }

    graphics.beginFill(0x000000, 1);
    graphics.lineStyle(river_width, 0xff0000, 1);

    graphics.drawRect(0,0,game.width,game.height);

    river_width = cursors.up.isDown ? 20 : 1;
    previous = null;
    river_joints.forEach(function(joint) {
        if (previous) {
            var p = screenCoordsToPixels(previous);
            var c = screenCoordsToPixels(joint);
            graphics.moveTo(p.x, p.y);
            graphics.lineTo(c.x, c.y);
        }
        previous = joint;
    });

    var h = screenCoordsToPixels(head);
    graphics.drawCircle(h.x, h.y, 3);
    graphics.endFill();
};

function distance(point_a, point_b) {
    return Math.sqrt(Math.pow(point_b.x - point_a.x, 2) + Math.pow(point_b.y - point_a.y, 2));
    // return Math.sqrt((point_a * point_a) + (point_b * point_b));
}

function screenCoordsToPixels(point) {
    return new Point(((point.x + 1) / 2) * game.width,
                     game.height - (((point.y + 1) / 2) * game.height));
}
