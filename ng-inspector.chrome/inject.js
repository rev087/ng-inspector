if (window.top === window) {
	
	// Inject the bridge script
	var inspectorScript = document.createElement('script');
	inspectorScript.type = 'text/javascript';
	inspectorScript.src = chrome.extension.getURL('/ng-inspector.js');
	document.documentElement.appendChild(inspectorScript);

	chrome.runtime.onMessage.addListener(function(message, sender) {
		if (message.command && message.command === 'ngi-toggle') {
			window.postMessage(JSON.stringify(message), window.location.origin);
		}
	});

	window.addEventListener('message', function(evt) {
		if (evt.origin !== window.location.origin) return;

		var eventData = event.data;
		if (!eventData || typeof eventData !== 'string') return;
		try {
			eventData = JSON.parse(eventData);
		} catch(e) {
			// Not a JSON object. Typically means another script on the page
			// is using postMessage. Safe to ignore
		}

		if (eventData.command === 'ngi-angular-found') {
			chrome.runtime.sendMessage({
			    from:    'content',
			    command: 'install-ngi-toggle'
			});
		}
	});
}
