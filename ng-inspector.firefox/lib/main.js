var manifest = require("package.json");

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
  contentScriptFile: pageModConfig.contentScriptFile,
  contentScriptOptions: {
    ngInspectorURL: self.data.url("./ng-inspector.js")
  },
  contentStyleFile: pageModConfig.contentStyleFile,
  onAttach: function(worker) {
    injectedTabPortsMap.set(this.tab, worker.port);
  }
});
