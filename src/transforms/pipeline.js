module.exports = function(payload) {
    return {
        pipe: function(handler) {
            var args = Array.prototype.slice.call(arguments, 1);
            handler.call(null, payload, args);
            return require('transforms/pipeline')(payload);
        }
    };
};
