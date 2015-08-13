var getAngularVersion = require('../helpers/getAngularVersion')();

module.exports = function(testName) {
    return function(done) {
        getAngularVersion.then(function(version) {
            browser.get([testName, version].join('/'));
            element(by.id('ngInspectorToggle')).click().then(done);
        });
    };
};
