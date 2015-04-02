// Docs for protractor 0.24:
// https://github.com/angular/protractor/blob/8582b195ed0f4d48a0d9513017b21e99f8feb2fe/docs/api.md
exports.config = {
  sauceUser: process.env.SAUCE_USERNAME,
  sauceKey: process.env.SAUCE_ACCESS_KEY,
  allScriptsTimeout: 11000,

  specs: [
    'e2e/specs/*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  chromeOnly: true,

  baseUrl: 'http://localhost:8000/',

  framework: 'jasmine',

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};