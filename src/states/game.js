// NOTE:
// add rows to the end of the array, but render in reverse so that
// array[0] renders at the bottom of the screen.

module.exports = new Phaser.State();

var PerlinGenerator = require('proc-noise');
var Perlin = new PerlinGenerator(123);
var config = require('config');
var game = null;
var river = [];
var river_string = null;
var res = 0.1;
var width;
var height;
var maps = {};
var cursors = null;
var rows = [];

module.exports.create = function() {
    var game_config = config.get('game');
    game = this.game;
    cursors = game.input.keyboard.createCursorKeys();

    width = game.width / 16;
    height = game.height / 16;

    var row = 0;
    row = gen(row, width, height / 2);
    row = gen(row, width, height / 2);
    row = gen(row, width, height / 2);

    draw(river, width);
    // loadTilemap(game, {
    //     map_name:   'map',
    //     data:       riverData(),
    //     tileset:    'overworld'
    // });
};

module.exports.update = function() {
    if (cursors.up.isDown) {
        rows.forEach(function(row) {
            row.y += .5;
        });
    }
};

function addRow() {
    rows.push(game.add.group());
    return rows[rows.length-1];
}

function draw(tiles, width) {
    var row = addRow();
    var x = 0;
    var y = 0;

    river.forEach(function(tile, i) {
        if (tile === 0) {
            row.add(game.add.tileSprite(x*16, y*16, 16, 16, 'grass'));
        }
        if (tile === 1) {
            row.add(game.add.tileSprite(x*16, y*16, 16, 16, 'water'));
        }
        x++;
        // new row
        if (i % width === 0 && i > 0) {
            row = addRow();
            y++;
            x = 0;
        }
    });
}

function floatFormat(f) {
    return Math.round(f*100)/100;
}

function gen(row, width, height) {
    for (var y=0; y<height; y++) {
        var p = Perlin.noise(row);
        var w = (p * 10) + 6;
        var offset = Math.floor((width - w) * p);
        var str = '';
        for (var x=0; x<width; x++) {
            var value = x <= offset ? 0 : x >= offset + w ? 0 : 1;
            river.push(value);
            str += value;
        }
        row += res;
        str += ' '+floatFormat(row, 100);
        // log(str);
    }
    return row;
}

function riverData() {
    if (river_string !== null) {
        return river_string;
    }

    river_string = '';

    river.forEach(function(value, i) {
        river_string += i % width !== 0 ? ',' : '\n';
        river_string += value;
    });

    return river_string;
}

function loadTilemap(game, options) {
    var tile_size = options.tile_size || 16;
    game.load.tilemap(options.map_name, null, options.data);

    var map = maps[options.map_name] = game.add.tilemap(options.map_name,
                                                        tile_size,
                                                        tile_size);
    map.addTilesetImage(options.tileset);

    map.layer = {};
    map.layer['0'] = map.createLayer(0);
    map.layer['0'].resizeWorld();
}
