module.exports = {
    defaults: {
        browsers: [
            'chrome',
            'firefox'
        ],
        extraCapabilities: {
            'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER
        }
    },
    versions: {
        "1.3.0": {
            path: "test/e2e/lib/angular/1.3.0.min.js",
            additionalSpecs: [],
            excludeSpecs: []
        },
        "1.2.0": {
            path: "test/e2e/lib/angular/1.2.0.min.js",
            additionalSpecs: [],
            excludeSpecs: []
        },
        "1.1.4": {
            path: "test/e2e/lib/angular/1.1.4.min.js",
            additionalSpecs: [],
            excludeSpecs: []
        },
        "1.0.6": {
            path: "test/e2e/lib/angular/1.0.6.min.js",
            additionalSpecs: [],
            excludeSpecs: [
                // No manual bootstrapping feature in 1.0.6
                "tests/requirejs/index.js"
            ]
        }
    }
};
