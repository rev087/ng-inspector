// Docs for protractor 0.24:
// https://github.com/angular/protractor/blob/8582b195ed0f4d48a0d9513017b21e99f8feb2fe/docs/api.md
exports.config = {
  allScriptsTimeout: 11000,

  params: {
    angularVersion: '1.3.0'
  },

  rootElement: 'div.angular-root-element',

  specs: [
    'e2e/specs/*.js'
  ],

  capabilities: {
    'browserName': 'chrome'
  },

  baseUrl: 'http://localhost:3000/app/',

  jasmineNodeOpts: {
    showColors: true,
    defaultTimeoutInterval: 30000
  }
};