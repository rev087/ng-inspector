if (window.top === window) {
  // Inject the bridge script
  var inspectorScript = document.createElement('script');
  inspectorScript.type = 'text/javascript';
  inspectorScript.src = self.options.ngInspectorURL;
  document.documentElement.appendChild(inspectorScript);

  // In Firefox, we use this thing

  self.port.on("ngi-command", function(message) {
    if (message.command && message.command === 'ngi-toggle') {
      document.defaultView.postMessage(JSON.stringify(message), window.location.origin);
    }
  });
}
