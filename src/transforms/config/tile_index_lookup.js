
// This module creates a lookup list for each tileset, containing a reference
// to the tile type and firstgid. The lookup list is indexed by the tile's
// map index, that is the sheet index you find in your tilesheet plus
// Tiled's firstgid.

// The reason why the index includes the firstgid is because
// Phaser.Tile.index includes firstgid, and that way it becomes much easier
// to look up any tile.

// The lookup list is added to config.tilesets[tileset_name].tiles._lookup,
// and it looks like this:
// _lookup: {
//     0: { type: 'floor', firstgid: 200 },
//     1: { type: 'wall', firstgid: 1 }
// }

var type = require('utils/type');

module.exports = function(config, args) {

    // TODO: ARG! This is not the way!

    var tilemaps_cache = require('states/boot').game.cache._tilemaps;

    Object.keys(tilemaps_cache).forEach(function(map_name) {
        var map_data = tilemaps_cache[map_name].data;

        for (var i=0, j=map_data.tilesets.length; i<j; i++) {
            var tileset_cache = map_data.tilesets[i];
            var tileset_config = config.tilesets[tileset_cache.name];
            if (type(tileset_config).is_undefined) {
                // There are no settings for this tileset
                continue;
            }
            var first_gid = tileset_cache.firstgid;
            var lookup = config.maps[map_name]._lookup = {};
            // var lookup = tileset_config.tiles._lookup = {};

            Object.keys(tileset_config.tiles).forEach(function(tile_type) {
                if (tile_type === '_lookup') {
                    // Don't create an index for the _lookup array
                    return;
                }
                var tile_config = tileset_config.tiles[tile_type];
                for (var k=0, l=tile_config.index.length; k<l; k++) {
                    var index = tile_config.index[k] + first_gid - 1;
                    lookup[index] = {
                        type: tile_type,
                        first_gid: first_gid,
                        tileset: tileset_cache.name
                    };
                }
            });
        }
    });
};
