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

	this.agent = new NGI.InspectorAgent();

	this.pane = new NGI.InspectorPane();

	// The actual toggling is done by the `NGI.InspectorPane`. Since the
	// `ng-inspector.js` script is injected into the page DOM with no direct
	// access to `safari.extension.settings`, settings can only be sent via
	// messages. To save on the number of messages sent back and forth between
	// this injected script and the browser extension, the browser settings are
	// sent along with the toggle command. A side effect is that changes in the
	// settings only take place after a toggle is executed.
	this.toggle = function(settings) {

		// Passing the settings parameter is optional
		this.settings.showWarnings = (settings && !!settings.showWarning);

		// Send the command forward to the NGI.InspectorPane, retrieving the state
		var visible = this.pane.toggle();
		if (visible) {
			this.agent.performInspection();
		}
	}

	// Debugging utlities, to be used in the console

	// Retrieves the "breadcrumb" of a specific scope in the hierarchy
	// usage: ngInspector.getScope('002');
	this.breadcrumb = function(id) {

		function dig(scope, breadcrumb) {
			var newBreadcrub = breadcrumb.slice(0);
			newBreadcrub.push(scope.$id);

			if (scope.$id == id) {
				console.log(newBreadcrumb);
				return scope;
			}

			var child = scope.$$childHead;

			if (!child) return;

			do {
				var res = dig(child, newBreadcrub);
				if (res) return res;
			} while (child = child.$$nextSibling);

		}
		return dig(angular.element(document.querySelector('html')).scope(), []);
	};

	// Traverses the DOM looking for a Node assigned to a specific scope
	// usage: ngInspector.nodeForScopeId
	this.nodeForScope = function(id) {
		function dig(el) {
			var child = el.firstChild;
			if (!child) return;
			do {
				var $el = angular.element(el);

				if (Object.keys($el.data()).length > 0) {

					var $scope = $el.data('$scope');
					var $isolate = $el.data('$isolateScope');

					if ($scope && $scope.$id == id) {
						return $scope;
					}
					else if ($isolate && $isolate.$id == id) {
						return $isolate;
					}
				}
				var res = dig(child);
				if (res) return res;
			} while (child = child.nextSibling);
		}
		return dig(document);
	};


};

