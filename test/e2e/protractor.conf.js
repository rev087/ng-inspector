var angularVersionsConfig = require('./angular-versions.conf');
var buildCapabilities = require('./helpers/buildCapabilities')(angularVersionsConfig);

exports.config = {
    allScriptsTimeout: 11000,

    rootElement: 'div.angular-root-element',

    specs: [
        'specs/*.js'
    ],

    maxSessions: 2,

    getMultiCapabilities: buildCapabilities,

    baseUrl: 'http://localhost:3000/app/',

    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000
    }
};
