module.exports = {
    defaults: {
        browsers: [
            'chrome',
            //'firefox'
        ]
    },
    versions: {
        "1.3.0": {
            path: "test/e2e/scenarios/lib/angular/1.3.0.min.js",
            additionalSpecs: [],
            excludeSpecs: [],
            extraCapabilities: {}
        },
        "1.2.0": {
            path: "test/e2e/scenarios/lib/angular/1.2.0.min.js",
            additionalSpecs: [],
            excludeSpecs: [],
            extraCapabilities: {}
        },
        "1.1.4": {
            path: "test/e2e/scenarios/lib/angular/1.1.4.min.js",
            additionalSpecs: [],
            excludeSpecs: [],
            extraCapabilities: {}
        },
        "1.0.6": {
            path: "test/e2e/scenarios/lib/angular/1.0.6.min.js",
            additionalSpecs: [],
            excludeSpecs: ["specs/requirejs.js"],
            extraCapabilities: {}
        }
    }
};
