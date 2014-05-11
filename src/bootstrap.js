window.addEventListener('load', function() {

	// Instantiate the inspector
	window.ngInspector = new NGI.Inspector();

});

window.addEventListener('message', function (event) {

	// Ensure the message was sent by this origin
	if (event.origin !== window.location.origin) return;

	// Respond to 'ngi-toggle' events only
	if (event.data && event.data.command === 'ngi-toggle') {


		// Fail if the inspector has not been initialized yet (before window.load)
		if ( !window.ngInspector ) {
			return console.error('The ng-inspector has not yet initialized');
		}

		window.ngInspector.toggle(event.data.settings);
	}

}, false);