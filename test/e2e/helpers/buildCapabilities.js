var format = require('util').format;
var objAssign = require('object-assign');

var BUILD_NUMBER = process.env.TRAVIS_BUILD_NUMBER;

function capabilityFromConfig(version, config) {
    return config.browsers.map(function(browser) {
        return objAssign({
            browserName: browser,
            ngVersion: version,
            name: getFriendlyName(version),
            specs: config.additionalSpecs,
            exclude: config.excludeSpecs
        }, config.extraCapabilities || {});
    });
};

function getFriendlyName(version) {
    var buildNumString = BUILD_NUMBER ? format(' - Build: %s', BUILD_NUMBER) : '';
    return format('Angular Version: %s%s', version, buildNumString);
}

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
