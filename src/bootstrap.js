var ngInspector = null;

window.addEventListener('load', function() {
	// Instantiate the inspector
	ngInspector = new NGInspector();

	if ('angular' in window) {
		var _bootstrap = angular.bootstrap;
		angular.bootstrap = function(element, modules) {
			ngInspector.bootstrappedApps.push({element:element, modules:modules});
			_bootstrap.apply(this, arguments);
		}
	}
});

window.addEventListener('message', function (e) {

	// Make sure the message was sent by this tab
	if (e.origin !== window.location.origin) return;

	// Filter toggle events
	if (e.data && e.data.command === 'ngi-toggle') {

		// Fail if the inspector has not been initialized yet
		if ( !ngInspector ) {
			return console.error('The ng-inspector has not yet initialized');
		}

		ngInspector.toggle(e.data.settings);
	}

}, false);