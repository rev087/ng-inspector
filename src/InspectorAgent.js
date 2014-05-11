/* global NGI, console */
/* jshint strict: false */
/* jshint expr: true */
/* jshint boss: true */

/**
 * As soon as instantiated, the `NGI.InspectorAgent` will wrap the `angular.bootstrap` method to capture any manual bootstraping of AngularJS Modules, performing the DOM traversal on the module subtree.
 * 
 * The `NGI.InspectorAgent` is responsible for traversing the DOM from a starting node and instantiating the classes in the NGI namespace that represent AngularJS objects. During the DOM traversal, the agent will look for data attached to the nodes by AngularJS, and perform the apropriate action:
 * 
 * .data() keys present      | action
 * --------------------      | ------
 * `$injector`               | instantiates `NGI.Module`
 * `$scope`                  | instantiates `NGI.Scope`, assign to `NGI.Module` instance
 * `$ngControllerController` | annotates a `NGI.Scope` instance
 * `$isolateScope`           | instantiates `NGI.Scope` (isolate), assign to `NGI.Scope`
 * 
 * Once the first `NGI.Module` is instantiated, additional lookups will be made for the declarative syntaxes of the directives that trigger scope creation defined in that module, exposed in the `NGI.Module` instance `.directives` property. See `NGI.Module` for the signature used to describe each directive.
 * 
 * 
 * property        | type    | description
 * --------        | ----    | -----------
 * `modules`       | `array` | 
 * 
 * The `bootstrapQueue` array is populated with objects representing the bootstrapped module, with the following signature:
 * 
 * 	{
 * 		node: Node,
 * 		requires: Array
 * 	}
 */

NGI.InspectorAgent = function() {

	// Before the DOM traversal starts, an object representation of manually
	// bootstrapped modules are stored here. See wrapBootstrap()
	var bootstrapQueue = [];

	// True once the wrapBootstrap() method runs for the first time
	var didWrapBootstrap = false;

	// `NGI.InspectorAgent` is instantiated in the `NGI.Inspector` constructor,
	// which in turn is instantiated on window.load. If angular was included via
	// a <script src=...> tag, the angular object should already be defined in
	// the window scope, and we can wrapBootstrap() right away
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
		} else {
			didWrapBootstrap = true;
		}

		// Cache the original `angular.bootstrap` method
		var _bootstrap = window.angular.bootstrap;

		window.angular.bootstrap = function(element, modules) {

			// Store an object representation of the module bootstrapping
			bootstrapQueue.push({
				node: element,
				requires: modules
			});

			// Continue with angular's native bootstrap method
			_bootstrap.apply(this, arguments);
		};

		// Once the `angular.bootstrap` method has been wrapped, we can stop
		// listening for DOMNodeInserted events, used to wait until angular has
		// been loaded by RequireJS or a similar mechanism
		document.removeEventListener('DOMNodeInserted', wrapBootstrap.bind(this));
	}

	// Utility functions used in the DOM traversal to identify AngularJS objects
	// attached to nodes
	var probe = {

		// Checks for the ngApp directive. Returns true if an anonymous ngApp
		// directive is found, the string value for a named ngApp directive or
		// false otherwise
		'ngApp': (function() {
			// var NG_APP_CLASS_REGEXP = /\sng[:\-]app(:\s*([\w\d_]+);?)?\s/;
			var attrs = ['ng:app', 'ng-app', 'x-ng-app', 'data-ng-app'];
			
			return function(node) {
				for (var i = 0; i < attrs.length; i++) {
					if ('hasAttribute' in node && node.hasAttribute(attrs[i])) {
						var value = node.getAttribute(attrs[i]);
						return value ? value : true;
					}
				}
			};
		})(),

		// Checks the node against the manually bootstrapped module signatures
		// captured by the `angular.bootstrap` wrapper. Returns the requires
		// array if a match is found, false otherwise
		'bootstrappedNode': function(node) {
			for (var i = 0; i < bootstrapQueue.length; i++) {
				if (bootstrapQueue[i].node === node) {
					return bootstrapQueue[i].requires;
				}
			}
			return false;
		}

	};


	function traverseDOM(node) {

		// Counter for the node probings being scheduled with setTimeout
		var probeQueue = 1;
		traverse(node, []);

		// The recursive DOM traversal function. This is the meat of
		// `NGI.InspectorAgent`, where AngularJS objects are identified in the DOM.
		function traverse(node, currentModule) {

			// We can skip all nodeTypes except ELEMENT, COMMENT and DOCUMENT nodes
			if (node.nodeType === Node.ELEMENT_NODE ||
				 node.nodeType === Node.COMMENT_NODE ||
				 node.nodeType === Node.DOCUMENT_NODE) {

				// Wrap the DOM node to get access to angular.element methods
				var $node = window.angular.element(node);

				var nodeData = $node.data();
				// if (Object.keys(nodeData).length > 0)
					// NGI.TreeView.flushNode(node);
				// ---REMOVE---
				// 	console.log(probeQueue, Object.keys(nodeData), node);
				// ---REMOVE---

				// The first check attempts to detect the presence of an AngularJS module
				// by checking for an instance of the AngularJS $injector service stored
				// in the DOM node
				if (nodeData.$injector) {

					var module;

					// Probe the node for the ngApp directive
					var ngApp = probe.ngApp(node);

					// An ngApp directive with a string value is the best way to
					// identify the module, as it gives us module name and dependencies
					if (typeof ngApp === typeof '') {
						module = NGI.Module.instance(node, ngApp);

					// Failing that, the next best thing is to identify it from a
					// captured `angular.bootstrap` call, as it gives us the list of
					// dependencies
					} else {
						// Probe the node for a captured manual bootstrap
						var bsRequires = probe.bootstrappedNode(node);

						if (!!bsRequires) {
							module = NGI.Module.instance(node, bsRequires);

						// The last alternative is an anonymous ngApp directive
						} else {
							module = NGI.Module.instance(node);
						}
					}

					// `parentModule` is declared outside of this function, so we keep
					// track of the current module being traversed
					currentModule = module;

					// Append the ngInspector
					window.ngInspector.pane.treeView.appendChild(module.view.element);
				}

				// Next up, scopes
				var $scope = nodeData.$scope;
				if ($scope) {
					var scope = NGI.Scope.instance(node, $scope, false);
					if ($scope.$parent) {
						var parentItem = NGI.Scope.get($scope.$parent.$id, 'Scope', node).view;
						parentItem.addChild(scope.view);
					} else {
						currentModule.view.addChild(scope.view);
					}
				}

				// Then, isolate scopes
				var $isolateScope = nodeData.$isolateScopeNoTemplate;
				if ($isolateScope) {
					var isolateScope = NGI.Scope.instance(node, $isolateScope, true);
					if ($isolateScope.$parent) {
						var parentItem = NGI.Scope.get($isolateScope.$parent.$id, 'Isolate Scope', node).view;
						parentItem.addChild(isolateScope.view);
					} else {
						currentModule.view.view.addChild(isolateScope.view);
					}
				}

				if (node.firstChild) {
					var child = node.firstChild;
					do {

						// Increment the probed nodes counter for the reporting
						probeQueue++;

						// setTimeout is used to make the traversal asyncrhonous, keeping
						// the browser UI responsive during traversal. This is an
						// experimental feature - it might cause inconsistencies if the
						// scopes are changed during the traversal

						// traverse(child, currentModule);
						setTimeout(
							traverse.bind(this, child, currentModule)
						); // 4ms is the spec minimum
					} while (child = child.nextSibling);
				}

			}
			probeQueue--;
			//ngInspector.settings.showWarnings
			if (--probeQueue === 0) {
				console.timeEnd('ng-inspector DOM traversal');
			}
			
		}
	}

	function traverseScope(ngScope, module) {

		var scopeQueue = 1;
		traverse(ngScope);

		function traverse(ngScope) {
			var rep = NGI.Scope.instance(ngScope);

			if (ngScope.$parent) {
				var parentItem = NGI.Scope.get(ngScope.$parent.$id).view;
				parentItem.addChild(rep.view);
			} else {
				module.view.addChild(rep.view);
			}

			var child = ngScope.$$childHead;
			if (child) {
				do {
					scopeQueue++;
					setTimeout(traverse.bind(this, child));
				} while (child = child.$$nextSibling);
			}

			if (--scopeQueue === 0) {
				console.timeEnd('ng-inspector scope traversal');
			}
		}
	}

	function inspectModule(node, requires) {
		var module = NGI.Module.instance(node, requires);
		window.ngInspector.pane.treeView.appendChild(module.view.element);
		var $node = window.angular.element(node);
		var $rootScope = $node.data('$scope').$root;

		console.time('ng-inspector scope traversal');
		traverseScope($rootScope, module);
	}

	function findModuleNodes() {
		var moduleNodes = [];
		var els = document.querySelectorAll('.ng-scope');
		els = Array.prototype.slice.apply(els, [0]);
		els.push(document);
		for (var i = 0; i < els.length; i++) {
			var $el = window.angular.element(els[i]);
			if ($el.data('$injector')) {
				moduleNodes.push(els[i]);
			}
		}
		return moduleNodes;
	}

	this.performInspection = function() {

		// If angular is not present in the global scope, we stop the process
		if (!('angular' in window)) {
			console.warn('This page does not include AngularJS.');
			return;
		}

		window.ngInspector.pane.treeView.innerHTML = '';

		var attrs = ['ng\\:app', 'ng-app', 'x-ng-app', 'data-ng-app'];
		
		var moduleNodes = findModuleNodes();
		for (var m = 0; m < moduleNodes.length; m++) {
			for (var i = 0; i < attrs.length; i++) {
				var requires = moduleNodes[m].getAttribute(attrs[i]);
				inspectModule(moduleNodes[m], requires);
			}
		};

		// Starts the DOM traversal mechanism
		// if (ngInspector.settings.showWarnings)
			console.time('ng-inspector DOM traversal');
		// traverseDOM(document);

	};
};