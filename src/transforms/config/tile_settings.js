
// This module completes the lookup list created by tile_index_lookup
// by filling it with data from config.tilesets. Tile manager will
// populate the created tiles object in a map with the settings object
// found in the lookup list.

module.exports = function(config, args) {

    require('transforms/config/tileset_index_range')(config);
    require('transforms/config/tile_index_lookup')(config);

    var config = require('config');
    var maps_config = config.get('maps');

    Object.keys(maps_config).forEach(function(map_name) {
        var maps = maps_config[map_name];
        if (!maps._lookup) {
            return;
        }

        Object.keys(maps._lookup).forEach(function(tile_index) {
            var lookup_data = maps._lookup[tile_index];
            var tile_settings = config.get(
                                    'tilesets', lookup_data.tileset,
                                    'tiles', lookup_data.type);

            lookup_data.sheet_index = tile_index - lookup_data.first_gid;
            // TODO: The default health value should be set somewhere in
            // config.json
            lookup_data.health = tile_settings.health ?
                                 tile_settings.health : -1;
            lookup_data.strength = tile_settings.strength ?
                                   tile_settings.strength : 0;

        });
    });
};
