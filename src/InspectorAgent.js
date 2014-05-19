/* global NGI */
/* jshint strict: false */
/* jshint expr: true */
/* jshint boss: true */

// `NGi.InspectorAgent` is responsible for the page introspection (Scope and DOM
// traversal)

NGI.InspectorAgent = (function() {

	function InspectorAgent() {}

	function traverseDOM(app, node) {

		// Counter for the recursions being scheduled with setTimeout
		var nodeQueue = 1;
		traverse(node, app);

		// The recursive DOM traversal function
		function traverse(node, app) {

			// We can skip all nodeTypes except ELEMENT and DOCUMENT nodes
			if (node.nodeType === Node.ELEMENT_NODE ||
				 node.nodeType === Node.DOCUMENT_NODE) {

				// Wrap the DOM node to get access to angular.element methods
				var $node = window.angular.element(node);

				var nodeData = $node.data();

				// If there's no AngularJS metadata in the node .data() store, we
				// just move on
				if (Object.keys(nodeData).length > 0) {

					// Match nodes with scopes attached to the relevant TreeViewItem
					var $scope = nodeData.$scope;
					if ($scope) {
						var scopeMatch = NGI.Scope.get($scope.$id);
						if (scopeMatch) {
							scopeMatch.setNode(node);
							app.probe(node, scopeMatch, false);
						}
					}

					// Match nodes with isolate scopes attached to the relevant
					// TreeViewItem
					if ($node.isolateScope) {
						var $isolate = $node.isolateScope();
						if ($isolate) {	
							var isolateMatch = NGI.Scope.get($isolate.$id);
							if (isolateMatch) {
								isolateMatch.setNode(node);
								app.probe(node, isolateMatch, true);
							}
						}
					}
				}

				if (node.firstChild) {
					var child = node.firstChild;
					do {
						// Increment the probed nodes counter, will be used for reporting
						nodeQueue++;

						// setTimeout is used to make the traversal asyncrhonous, keeping
						// the browser UI responsive during traversal.
						setTimeout(
							traverse.bind(this, child, app)
						); // 4ms is the spec minimum
					} while (child = child.nextSibling);
				}

			}
			nodeQueue--;
			if (--nodeQueue === 0) {
				// Done
			}
			
		}
	}

	function traverseScopes(ngScope, app, callback) {

		var scopeQueue = 1;
		traverse(ngScope);

		function traverse(ngScope) {
			var rep = NGI.Scope.instance(app, ngScope);
			rep.startObserver();

			if (ngScope.$parent) {
				var parent = NGI.Scope.get(ngScope.$parent.$id).view;
				parent.addChild(rep.view);
			} else {
				app.view.addChild(rep.view);
			}

			var child = ngScope.$$childHead;
			if (child) {
				do {
					scopeQueue++;
					setTimeout(traverse.bind(this, child));
				} while (child = child.$$nextSibling);
			}

			if (--scopeQueue === 0) {
				// Done
				if (typeof callback === 'function') callback();
			}
		}
	}

	// Adds the TreeView item for the AngularJS application bootstrapped at
	// the `node` argument.
	InspectorAgent.inspectApp = function(app) {

		window.ngInspector.pane.treeView.appendChild(app.view.element);

		// With the root Node for the app, we retrieve the $rootScope
		var $node = window.angular.element(app.node);
		var $rootScope = $node.data('$scope').$root;

		// Then start the Scope traversal mechanism
		traverseScopes($rootScope, app, function() {

			// Once the Scope traversal is complete, the DOM traversal starts
			traverseDOM(app, app.node);
			
		});
	};

	InspectorAgent.inspectScope = function(app, scope) {
		traverseScopes(scope, app);
	};

	InspectorAgent.inspectNode = function(app, node) {
		traverseDOM(app, node);
	};

	return InspectorAgent;
})();