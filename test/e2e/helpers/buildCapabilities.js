var objAssign = require('object-assign');

function capabilityFromConfig(version, config) {
    return config.browsers.map(function(browser) {
        return objAssign({
            browserName: browser,
            name: version,
            logName: version,
            specs: config.additionalSpecs,
            exclude: config.excludeSpecs
        }, config.extraCapabilities || {});
    });
};

function flattenArray(array) {
    return [].concat.apply([], array);
}

module.exports = function(config) {
    return function() {
        return flattenArray(Object.keys(config.versions).map(function(key) {
            var configWithDefaults = objAssign({}, config.defaults, config.versions[key]);
            return capabilityFromConfig(key, configWithDefaults);
        }));
    };
};
