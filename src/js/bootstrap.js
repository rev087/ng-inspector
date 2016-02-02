var NGI = {
	Inspector: require('./Inspector'),
	App: require('./App'),
	PublishEvent: require('./PublishEvent')
};

var _angular;
var _bootstrap;


// Wrap Angular property (prior to being defined by angular itself)
// so we can be notified when Angular is present on the page, without
// having to resort to polling
Object.defineProperty(window, 'angular', {
	// enumerable: false to prevent other extensions (WAppalyzer, for example)
	// from thinking angular is present by checking "if (angular in window)"
	enumerable: false,
	configurable: true,
	get: function() { return _angular; },
	set: function(val) {
		_angular = val;
		wrapBootstrap();
		// Now that Angular is present on the page, allow the property to be
		// visible through reflection
		Object.defineProperty(window, 'angular', { enumerable: true });
		NGI.PublishEvent('ngi-angular-found');
	}
});

function wrapBootstrap() {
	// Hook Angular's manual bootstrapping mechanism to catch applications
	// that do not use the "ng-app" directive
	Object.defineProperty(_angular, 'bootstrap', {
		get: function() {
			// Return falsey val when angular hasn't assigned it's own bootstrap
			// prop yet, or will get warning about multiple angular versions loaded
			return _bootstrap ? modifiedBootstrap : null;
		},
		set: function(val) {
			_bootstrap = val;
		}
	});
}

var modifiedBootstrap = function(node, modules) {
	// Used to monkey-patch over angular.bootstrap, to allow the extension
	// to be notified when a manually-bootstrapped app has been found. Necessary
	// since we can't find the application by traversing the DOM looking for ng-app
	initializeInspector();

	// Continue with angular's native bootstrap method
	var ret = _bootstrap.apply(this, arguments);

	// Unwrap if jQuery or jqLite element
	if (node.jquery || node.injector) node = node[0];

	NGI.App.bootstrap(node, modules);

	return ret;
};

// Attempt to initialize inspector at the same time Angular's ng-app directive
// kicks off. If angular isn't found at this point, it has to be a manually
// bootstrapped app
document.addEventListener('DOMContentLoaded', initializeInspector);

function initializeInspector() {
	if (_angular && !window.ngInspector) {
		window.ngInspector = new NGI.Inspector();
	}
}

window.addEventListener('message', function (event) {
	if (event.origin !== window.location.origin) return;

	var eventData = event.data;
	if (!eventData || typeof eventData !== 'string') return;
	try {
		eventData = JSON.parse(eventData);
	} catch(e) {
		// Not a JSON object. Typically means another script on the page
		// is using postMessage. Safe to ignore
	}

	if (eventData.command === 'ngi-toggle') {
		// Fail if the inspector has not been initialized yet (before window.load)
		if (!window.ngInspector) {
			return console.warn('ng-inspector: The page must finish loading before using ng-inspector');
		}

		window.ngInspector.toggle(eventData.settings);
	}

}, false);
