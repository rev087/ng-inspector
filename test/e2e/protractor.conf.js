var angularVersionsConfig = require('./angular-versions.conf');
var buildCapabilities = require('./helpers/buildCapabilities')(angularVersionsConfig);

exports.config = {
    sauceUser: process.env.SAUCE_USERNAME,

    sauceKey: process.env.SAUCE_ACCESS_KEY,

    allScriptsTimeout: 11000,

    rootElement: 'div.angular-root-element',

    // Default specs for all angular versions
    // Include/Exclude additional tests for specific
    // versions in angular-versions.conf.js
    specs: [
        'tests/**/index.js'
    ],

    getMultiCapabilities: buildCapabilities,

    baseUrl: 'http://localhost:3000/app/',

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};
