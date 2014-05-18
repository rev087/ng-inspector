/* jshint strict: false */

var NGI = {};

NGI.newID = (function() {
	var id = 0;
	return function() { return id++; };
})();

NGI.Inspector = function() {

	// Settings defaults
	this.settings = {
		showWarnings: false
	};

	this.pane = new NGI.InspectorPane();

	// The actual toggling is done by the `NGI.InspectorPane`. Since the
	// `ng-inspector.js` script is injected into the page DOM with no direct
	// access to `safari.extension.settings`, settings can only be sent via
	// messages. To save on the number of messages sent back and forth between
	// this injected script and the browser extension, the browser settings are
	// sent along with the toggle command. A side effect is that changes in the
	// settings only take place after a toggle is executed.
	this.toggle = function(settings) {

		// If angular is not present in the global scope, we stop the process
		if (!('angular' in window)) {
			alert('This page does not include AngularJS');
			return;
		}

		// Passing the settings parameter is optional
		this.settings.showWarnings = (settings && !!settings.showWarning);

		// Send the command forward to the NGI.InspectorPane, retrieving the state
		var visible = this.pane.toggle();
		if (visible) {
			NGI.App.inspectApps();
		} else {
			NGI.App.stopObservers();
			NGI.Scope.stopObservers();
		}
	}

	// Debugging utlity, to be used in the console. Retrieves the "breadcrumb" of
	// a specific scope in the hierarchy usage: ngInspector.scope('002')
	this.scope = function(id) {

		function findRoot(el) {
			var child = el.firstChild;
			if (!child) return;
			do {
				var $el = angular.element(el);

				if ($el.data('$scope')) {
					return $el.data('$scope').$root;
				}

				var res = findRoot(child);
				if (res) return res;

			} while (child = child.nextSibling);
		}

		function dig(scope, breadcrumb) {
			var newBreadcrumb = breadcrumb.slice(0);
			newBreadcrumb.push(scope.$id);

			if (scope.$id == id) {
				console.log(newBreadcrumb);
				return scope;
			}

			var child = scope.$$childHead;

			if (!child) return;

			do {
				var res = dig(child, newBreadcrumb);
				if (res) return res;
			} while (child = child.$$nextSibling);

		}

		return dig(findRoot(document), []);
	};

};