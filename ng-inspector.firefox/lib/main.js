var manifest = {};
try {
  // on jpm (Firefox >= 38) loads configuration from the package.json metadata
  manifest = require("package.json");
} catch(e) {
  // on cfx (Firefox < 38) fallbacks to configure it here
  manifest["firefox-devtools"] = {
    "page-mods": [
      {
        "include": [
          "*"
        ],
        "contentStyleFiles": [
          "./stylesheet.css"
        ],
        "contentScriptFiles": [
          "./inject.js"
        ]
      }
    ],
    "toolbar-buttons": [
      {
        "label": "ng-inspector",
        "icons": {
          "19": "./btn19.png",
          "38": "./btn38.png"
        }
      }
    ]
  };
}

var toolbarButtonConfig = manifest["firefox-devtools"]["toolbar-buttons"][0];

var { ActionButton } = require("sdk/ui/button/action");
var tabs = require("sdk/tabs");

var injectedTabPortsMap = new WeakMap();

var button = ActionButton({
  id: "ng-inspector",
  label: toolbarButtonConfig.label,
  icon: {
    "16": toolbarButtonConfig.icons["19"],
    "32": toolbarButtonConfig.icons["38"]
  },
  onClick: function(state) {
    var port = injectedTabPortsMap.get(tabs.activeTab);

    if (port) {
      port.emit("ngi-command", {
        command: "ngi-toggle"
      });
    }
  }
});

var pageModConfig = manifest["firefox-devtools"]["page-mods"][0]
var pageMod = require("sdk/page-mod");
var self = require("sdk/self");

pageMod.PageMod({
  include: pageModConfig.include,
  contentScriptFile: pageModConfig.contentScriptFiles.map(function(path) {
    return self.data.url(path);
  }),
  contentScriptOptions: {
    ngInspectorURL: self.data.url("./ng-inspector.js")
  },
  contentStyleFile: pageModConfig.contentStyleFiles.map(function(path) {
    return self.data.url(path);
  }),
  onAttach: function(worker) {
    injectedTabPortsMap.set(this.tab, worker.port);
  }
});
