/* global NGI */
/* jshint strict: false */
/* jshint expr: true */

NGI.App = (function(window) {

	function App(node, modules) {
		var pane = document.getElementsByClassName('ngi-inspector')[0];
		var app = this;
		var observer = new MutationObserver(function(mutations) {
			setTimeout(function() {
				for (var i = 0; i < mutations.length; i++) {
					var target = mutations[i].target;

					// Avoid responding to mutations in the extension UI
					if (!pane.contains(target)) {
						for (var f = 0; f < mutations[i].addedNodes.length; f++) {
							NGI.InspectorAgent.inspectNode(app, mutations[i].addedNodes[f]);
						}
					}
				}
			}, 4);
		});
		var observerConfig = { childList: true, subtree: true };

		this.startObserver = function() {
			observer.observe(node, observerConfig);
		};

		this.stopObserver = function() {
			observer.disconnect();
		};

		this.node = node;

		this.$injector = window.angular.element(node).injector();
		
		if (!modules) {
			modules = [];
		} else if (typeof modules === typeof '') {
			modules = [modules];
		}

		var probes = [builtInProbe];
		this.registerProbe = function(probe) {
			probes.push(probe);
		};

		this.probe = function(node, scope, isIsolate) {
			for (var i = 0; i < probes.length; i++) {
				probes[i](node, scope, isIsolate);
			}
		};

		// Attempt to retrieve the property of the ngApp directive in the node from
		// one of the possible declarations to retrieve the AngularJS module defined
		// as the main dependency for the app. An anonymous ngApp is a valid use
		// case, so this is optional.
		var attrs = ['ng\\:app', 'ng-app', 'x-ng-app', 'data-ng-app'];
		var main;
		if ('getAttribute' in node) {
			for (var i = 0; i < attrs.length; i++) {
				if (node.hasAttribute(attrs[i])) {
					main = node.getAttribute(attrs[i]);
					break;
				}
			}
			if (main) {
				modules.push(main);
			}
		}

		// Register module dependencies
		for (var m = 0; m < modules.length; m++) {
			NGI.Module.register(this, modules[m]);
		}

		var label = main ? main : nodeRep(node);
		this.view = NGI.TreeView.appItem(label, node);
		window.ngInspector.pane.treeView.appendChild(this.view.element);
	}

	// This probe is registered by default in all apps, and probes nodes
	// for AngularJS built-in directives that are not exposed in the _invokeQueue
	// despite the 'ng' module being a default dependency
	function builtInProbe(node, scope) {

		if (node === document) {
			node = document.getElementsByTagName('html')[0];
		}

		if (node && node.hasAttribute('ng-repeat')) {
			scope.view.addAnnotation('ngRepeat', NGI.Service.BUILTIN);
		}

		// Label ng-include scopes
		if (node && node.hasAttribute('ng-include')) {
			scope.view.addAnnotation('ngInclude', NGI.Service.BUILTIN);
		}

		// Label ng-if scopes
		if (node && node.hasAttribute('ng-if')) {
			scope.view.addAnnotation('ngIf', NGI.Service.BUILTIN);
		}

		// Label root scopes
		if (scope.ngScope.$root.$id === scope.ngScope.$id) {
			scope.view.addAnnotation('$rootScope', NGI.Service.BUILTIN);
		}

		// Label ng-transclude scopes
		if (node && node.parentNode && node.parentNode.hasAttribute &&
			node.parentNode.hasAttribute('ng-transclude')) {
			scope.view.addAnnotation('ngTransclude', NGI.Service.BUILTIN);
		}
	}

	var appCache = [];
	App.bootstrap = function(node, modules) {
		for (var i = 0; i < appCache.length; i++) {
			if (appCache[i].node === node) {
				return appCache[i];
			}
		}
		appCache.push(new App(node, modules));
	};

	App.findApps = function () {
		var els = document.querySelectorAll('.ng-scope');

		// Clone els so we can include the document itself as a valid root node for
		// the AngularJS app
		els = Array.prototype.slice.apply(els, [0]);
		els.push(document);

		// Inspect each app
		for (var i = 0; i < els.length; i++) {
			var $el = window.angular.element(els[i]);
			if ($el.data('$injector')) {
				App.bootstrap(els[i]);
			}
		}
	};

	var didFindApps = false;

	App.inspectApps = function() {
		if (!didFindApps) {
			App.findApps();
			didFindApps = true;
		}

		for (var i = 0; i < appCache.length; i++) {
			NGI.InspectorAgent.inspectApp(appCache[i]);
		}

		App.startObservers();
	};

	App.startObservers = function() {
		for (var i = 0; i < appCache.length; i++) {
			appCache[i].startObserver();
		}

	};

	App.stopObservers = function() {
		for (var i = 0; i < appCache.length; i++) {
			appCache[i].stopObserver();
		}
	};

	// Utility function that returns a string representation of a DOM Node similar
	// to CSS selectors to be shown in the UI
	function nodeRep(node) {
		if (node === document) return 'document';

		// tag
		var rep = node.tagName.toLowerCase();

		// #id
		if (node.hasAttribute('id')) {
			rep += '<small>#' + node.getAttribute('id') + '</small>';
		}

		// .class.list
		var classList = node.className.split(/\s/);
		for (var i = 0; i < classList.length; i++) {
			rep += '<small>.' + classList[i] + '</small>';
		}

		return rep;
	}

	return App;

})(window);