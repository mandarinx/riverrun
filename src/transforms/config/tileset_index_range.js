
// Checks tilesets for tile index settings like "1-32", which is a
// custom short form for specifying all tiles indexes from 1 to, and
// including 32.

// NOTE: The same module could be used to enable the same custom
// range setting for animation configs. Animations use 'frames'
// instead of 'index', so the function would have to be able to look
// for either.

var transformed = false;
var type = require('utils/type');

module.exports = function(config, args) {
    if (transformed) {
        return;
    }

    if (!config.tilesets) {
        return;
    }

    Object.keys(config.tilesets).forEach(function(tileset) {
        var tiles = config.tilesets[tileset].tiles;
        Object.keys(tiles).forEach(function(tile_name) {
            var tile = tiles[tile_name];
            if (type(tile.index).is_string) {
                // TODO: Should add functions for stripping whitespace and
                // whatnot
                var range = tile.index.split('-');
                if (range.length !== 2) {
                    console.error('Entry for collision indexes for tileset '+
                                  tileset+', tile '+tile+' is not '+
                                  'formatted correctly.');
                } else {
                    tile.index = fill_range(range);
                }
            }
        });
    });

    transformed = true;
};

var fill_range = function(range) {
    var from = parseInt(range[0]);
    var to = parseInt(range[1]);
    var len = (to+1) - from;
    var list = [];
    for (var i=from; i<(from+len); i++) {
        list.push(i);
    }
    return list;
};
