var NGI = {
	Inspector: require('./Inspector'),
	App: require('./App')
};

function bootstrap() {

	// Instantiate the inspector
	window.ngInspector = new NGI.Inspector();

	// True once the wrapBootstrap() method runs for the first time
	var didWrapBootstrap = false;

	// RequireJS and similar loaders work by injecting <script> tags into the
	// DOM. If the page uses such mechanism, the angular namespace might not
	// yet be available by the time `NGI.InspectorAgent` is instantiated. By
	// listening to the MutationOvserver we can support this use case.
	var loaderObserver = new MutationObserver(wrapBootstrap.bind(this));

	// If angular was included via <script src=...> tag, the angular object should
	// already be present in the window scope, and we can wrapBootstrap() right
	// away
	if (window.angular && window.angular.bootstrap) {
		wrapBootstrap();
	} else {
		loaderObserver.observe(document, { childList: true, subtree: true });
	}

	// The manual AngularJS module bootstrap capturing mechanism, wraps the
	// `angular.bootstrap` method
	function wrapBootstrap() {

		// Prevent wrapping bootstrap method if it doesn't currently exist,
		// or if it's already been wrapped
		if (!window.angular || window.angular && !window.angular.bootstrap || didWrapBootstrap) {
			return;
		}

		// Cache the original `angular.bootstrap` method
		var _bootstrap = window.angular.bootstrap;

		window.angular.bootstrap = function(node, modules) {

			// Continue with angular's native bootstrap method
			var ret = _bootstrap.apply(this, arguments);

			// Unwrap if jQuery or jqLite element
			if (node.jquery || node.injector) node = node[0];

			// The dependencies are registered by the `NGI.Module` object
			NGI.App.bootstrap(node, modules);

			return ret;
		};

		didWrapBootstrap = true;
		loaderObserver.disconnect();
	}

}

if (document.readyState === 'complete') {
	bootstrap();
} else {
	window.addEventListener('load', bootstrap);
}

window.addEventListener('message', function (event) {

	// Ensure the message was sent by this origin
	if (event.origin !== window.location.origin) return;

	var eventData = event.data;
	if (!eventData || typeof eventData !== 'string') return;
	try {
		eventData = JSON.parse(eventData);
	} catch(e) {
		// Not a JSON object. Typically means another script on the page
		// is using postMessage. Safe to ignore
	}

	// Respond to 'ngi-toggle' events only
	if (eventData.command === 'ngi-toggle') {


		// Fail if the inspector has not been initialized yet (before window.load)
		if ( !window.ngInspector ) {
			return console.warn('ng-inspector: The page must finish loading before using ng-inspector');
		}

		window.ngInspector.toggle(eventData.settings);
	}

}, false);