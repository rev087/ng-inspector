if (window.top === window) {

	// Inject the bridge script
	var bridgeScript = document.createElement('script');
	bridgeScript.type = 'text/javascript';
	bridgeScript.src = safari.extension.baseURI + 'ng-inspector.js';
	document.head.appendChild(bridgeScript);

	// Forward the toggle event
	safari.self.addEventListener('message', function(event) {
		if ( event.name == 'toggle-inspector') {
			var message = {
				command: 'ngi-toggle',
				settings: event.message
			};
			window.postMessage(message, window.location.origin);
		}
	}, false);

}