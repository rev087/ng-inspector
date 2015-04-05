if (window.top === window) {

	// Inject the bridge script
	var inspectorScript = document.createElement('script');
	inspectorScript.type = 'text/javascript';
	inspectorScript.src = safari.extension.baseURI + 'ng-inspector.js';
	document.head.appendChild(inspectorScript);

	// Forward the toggle event
	safari.self.addEventListener('message', function(event) {
		if ( event.name == 'toggle-inspector') {
			var message = {
				command: 'ngi-toggle',
				settings: event.message
			};
			window.postMessage(JSON.stringify(message), window.location.origin);
		}
	}, false);

}