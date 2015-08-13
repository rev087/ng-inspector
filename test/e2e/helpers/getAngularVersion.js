module.exports = function() {
    return browser.getProcessedConfig().then(function(config) {
        return config.capabilities.ngVersion;
    });
};
