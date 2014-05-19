/* global NGI, console */
/* jshint strict: false */

function bootstrap() {

	// Instantiate the inspector
	window.ngInspector = new NGI.Inspector();

	// True once the wrapBootstrap() method runs for the first time
	var didWrapBootstrap = false;

	// If angular was included via <script src=...> tag, the angular object should
	// already be present in the window scope, and we can wrapBootstrap() right
	// away
	if ('angular' in window) {
		wrapBootstrap();
	} else {
		// RequireJS and similar loaders work by injecting <script> tags into the
		// DOM. If the page uses such mechanism, the angular namespace might not
		// yet be available by the time `NGI.InspectorAgent` is instantiated. By
		// listening to the DOMNodeInserted event we can support this use case.
		document.addEventListener('DOMNodeInserted', wrapBootstrap.bind(this));
	}

	// The manual AngularJS module bootstrap capturing mechanism, wraps the
	// `angular.bootstrap` method
	function wrapBootstrap() {

		// Ensure that the angular object exists in the window scope and the
		// `angular.bootstrap` method is wrapped only once
		if (!window.angular || didWrapBootstrap) {
			return;
		}

		// Cache the original `angular.bootstrap` method
		var _bootstrap = window.angular.bootstrap;

		window.angular.bootstrap = function(node, modules) {

			// The dependencies are regitered by the `NGI.Module` object
			NGI.App.bootstrap(node, modules);

			// Continue with angular's native bootstrap method
			_bootstrap.apply(this, arguments);
		};

		// Once the `angular.bootstrap` method has been wrapped, we can stop
		// listening for DOMNodeInserted events, used to wait until angular has
		// been loaded by RequireJS or a similar mechanism
		document.removeEventListener('DOMNodeInserted', wrapBootstrap.bind(this));
		didWrapBootstrap = true;
	}

}

if (document.readyState === 'complete') {
	bootstrap();
} else {
	window.addEventListener('load', bootstrap);
}

// In Safari, we use window messages
window.addEventListener('message', function (event) {

	// Ensure the message was sent by this origin
	if (event.origin !== window.location.origin) return;

	// Respond to 'ngi-toggle' events only
	if (event.data && event.data.command === 'ngi-toggle') {


		// Fail if the inspector has not been initialized yet (before window.load)
		if ( !window.ngInspector ) {
			return console.warn('The ng-inspector has not yet initialized');
		}

		window.ngInspector.toggle(event.data.settings);
	}

}, false);