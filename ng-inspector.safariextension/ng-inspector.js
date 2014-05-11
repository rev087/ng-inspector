"use strict";
(function(window) {
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

	// Counter for the node probings being scheduled with setTimeout
	var probeQueue = 0;

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
			if (nodeData['$injector']) {

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
			var $scope = nodeData['$scope'];
			if ($scope) {
				var scope = NGI.Scope.instance(node, $scope, false);
				if ($scope.$parent) {
					console.log($scope.$id, $scope.$parent.$id, $scope.$root.$id);
					var parentItem = NGI.Scope.get($scope.$parent.$id, 'Scope', node).view;
					parentItem.addChild(scope.view);
				} else {
					currentModule.view.addChild(scope.view);
				}
			}

			// Then, isolate scopes
			var $isolateScope = nodeData['$isolateScopeNoTemplate'];
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

					traverse(child, currentModule);
					// setTimeout(
					// 	traverse.bind(this, child, currentModule),
					// 	4); // 4ms is the spec minimum
				} while (child = child.nextSibling);
			}

		}
		probeQueue--;
		//ngInspector.settings.showWarnings
		if (-probeQueue === 0) {
			console.timeEnd('ng-inspector');
		}
		
	}

	// Starts the DOM traversal mechanism
	this.performInspection = function() {

		var ngInspector = window.ngInspector;

		// If angular is not present in the global scope, we stop the process
		if (!('angular' in window)) {
			console.warn('This page does not include AngularJS.');
			return;
		}

		// If the showWarnings setting is enabled, a timer is instantiated to
		// display the total running time
		// if (ngInspector.settings.showWarnings)
			console.time('ng-inspector');

		window.ngInspector.pane.treeView.innerHTML = '';

		probeQueue = 1;
		traverse(document);

	};
};

/* global NGI */
/* jshint strict: false */

/**
 * `NGI.InspectorPane` is responsible for the root element and basic interaction
 * with the pane (in practice, a <div>) injected in the page DOM, such as
 * toggling the pane on and off, handle mouse scrolling, resizing and child
 * views.
 */

NGI.InspectorPane = function() {

	// Create the root DOM node for the inspector pane
	var pane = document.createElement('div');
	pane.className = 'ngi-inspector';
	pane.innerHTML = '';
	pane.style.width = inspectorWidth + 'px';

	// Create and expose the root DOM node for the treeView
	this.treeView = document.createElement('div');
	pane.appendChild(this.treeView);

	this.addView = function(view) {
		pane.appendChild(view);
	};

	// Toggle the inspector pane on and off. Returns a boolean representing the
	// new visibility state.
	this.toggle = function() {
		if ( pane.parentNode ) {
			document.body.removeChild(pane);
			return false;
		} else {
			document.body.appendChild(pane);
			return true;
		}
	};

	var inspectorPane = this;

	// Prevent scrolling the page when the scrolling inside the inspector pane
	// reaches the top and bottom limits
	pane.addEventListener('mousewheel', function(event) {
		if ((event.wheelDeltaY > 0 && pane.scrollTop === 0) ||
			(event.wheelDeltaY < 0 && (
				pane.scrollTop + pane.offsetHeight) === pane.scrollHeight
			)) {
			event.preventDefault();
		}
	});

	// The width of the pane can be resized by the user, and is persisted via
	// localStorage
	var inspectorWidth = localStorage.getItem('ng-inspector-width') || 300;

	// States for the inspector pane resizing functionality
	this.isResizing = false;
	this.canResize = false;

	// Defines how many pixels to the left and right of the border of the pane
	// are considered within the resize handle
	var LEFT_RESIZE_HANDLE_PAD = 3;
	var RIGHT_RESIZE_HANDLE_PAD = 2;

	// Listen for mousemove events in the page body, setting the canResize state
	// if the mouse hovers close to the 
	document.addEventListener('mousemove', function(event) {

		// Don't do anything if the inspector is detached from the DOM
		if (!pane.parentNode) return;

		// Check if the mouse cursor is currently hovering the resize handle,
		// consisting of the vertical pixel column of the inspector border plus
		// a pad of pixel columns to the left and right. The class added to
		// the page body is used for styling the cursor to `col-resize`
		if (pane.offsetLeft - LEFT_RESIZE_HANDLE_PAD <= event.clientX &&
			event.clientX <= pane.offsetLeft + RIGHT_RESIZE_HANDLE_PAD) {
			inspectorPane.canResize = true;
			document.body.classList.add('ngi-resize');
		} else {
			inspectorPane.canResize = false;
			document.body.classList.remove('ngi-resize');
		}
		
		// If the user is currently performing a resize, the width is adjusted
		// based on the cursor position
		if (inspectorPane.isResizing) {

			var width = (document.width - event.clientX);

			// Enforce minimum and maximum limits
			if (width >= document.body.offsetWidth - 50) {
				width = document.body.offsetWidth - 50;
			} else if (width <= 100) {
				width = 100;
			}

			pane.style.width = width + 'px';
		}
	});

	// Listen to mousedown events in the page body, triggering the resize mode
	// (isResizing) if the cursor is within the resize handle (canResize). The
	// class added to the page body styles it to disable text selection while the
	// user dragging the mouse to resize the pane. In Safari, the previous
	// selection is restored once the class is removed
	document.addEventListener('mousedown', function() {
		if (inspectorPane.canResize) {
			inspectorPane.isResizing = true;
			document.body.classList.add('ngi-resizing');
		}
	});

	// Listen to mouseup events on the page, turning off the resize mode if one
	// is underway. The inspector width is then persisted in the localStorage
	document.addEventListener('mouseup', function() {
		if (inspectorPane.isResizing) {
			inspectorPane.isResizing = false;
			document.body.classList.remove('ngi-resizing');
			localStorage.setItem('ng-inspector-width', inspectorPane.element.offsetWidth);
		}
	});

	// If the user contracts the window, this makes sure the pane won't end up
	// wider thant the viewport
	window.addEventListener('resize', function() {
		if (pane.offsetWidth >= document.body.offsetWidth - 50) {
			pane.style.width = (document.body.offsetWidth - 50) + 'px';
		}
	});

};

/* global NGI, console */
/* jshint strict: false */
/* jshint expr: true */

NGI.TreeView = (function() {

	function TreeViewItem(label, node) {

		if (node === document) node = document.querySelector('html');

		this.element = document.createElement('div');

		this.label = document.createElement('label');
		this.label.innerHTML = label;
		this.element.appendChild(this.label);

		this.drawer = document.createElement('div');
		this.drawer.className = 'ngi-drawer';
		this.element.appendChild(this.drawer);

		this.label.addEventListener('click', function() {
			console.log(node);
			TreeView.flushNode(node);
		});

		this.addChild = function(childItem) {
			this.drawer.appendChild(childItem.element);
		};

		this.destroy = function() {
			TreeViewItem.flushNode(node);
			this.element.parentNode.removeChild(this.element);
		};

		// Highlight DOM elements the scope is attached to when hovering the item
		// in the inspector
		this.label.addEventListener('mouseover', function() {
			if ( !window.ngInspector.pane.isResizing ) {
				var target = node === document ? document.querySelector('html') : node;
				target.classList.add('ngi-highlight');
			}
		});
		this.label.addEventListener('mouseout', function() {
			var target = node === document ? document.querySelector('html') : node;
			target.classList.remove('ngi-highlight');
		});
	}

	function TreeView() {}

	var nodeMapping = [];

	// Creates a new TreeViewInstance, with styling and metadata relevant for
	// AngularJS modules
	TreeView.moduleItem = function(label, node) {
		var item = new TreeViewItem(label, node);
		item.element.className = 'ngi-app';
		nodeMapping.push({node:node, view:item.element});
		return item;
	};

	// Creates a new TreeViewInstance, with styling and metadata relevant for
	// AngularJS scopes
	TreeView.scopeItem = function(label, node, depth, isIsolate) {
		var item = new TreeViewItem(label, node);
		item.element.className = 'ngi-scope';
		if (isIsolate) {
			item.element.classList.add('ngi-isolate-scope');
		}
		item.label.className = 'ngi-depth-' + depth;
		nodeMapping.push({node:node, view:item.element});
		return item;
	};

	// Destroy all TreeViewItem instances that represent AngularJS objects
	// attached to a DOM node or its subtree
	TreeView.flushNode = function(node) {

		// Since we'll be removing items from the nodeMapping array, the for loop
		// is done backwards
		for (var i = nodeMapping.length-1; i >= 0; i--) {
			var item = nodeMapping[i];

			// Node.contains returns true if the Node passed as an argument is
			// a descendant in the DOM, or the element itself.
			if (node.contains(item.node)) {

				// Remove the TreeViewItem node from the DOM
				item.view.parentNode.removeChild(item.view);

				// Remove the item from the `nodeMapping` array
				nodeMapping.splice(i, 1);
			}
		}
	};

	return TreeView;

})();

/* global NGI */
/* jshint strict: false */
/* jshint expr: true */

/**
 * This class is instantiated during the DOM traversal performed by the `NGI.InspectorAgent`.
 * 
 * On instantiation, `NGI.Module` will attempt to retrieve the value of the ngApp directive in the DOM node the module was bootstrapped to, then use the name to retrieve the module instance with `angular.module(name)`, iterate through the `_invokeQueue` and populate the `directives` array with a simplified signature for all the directives defined in the module that create a scope.
 * 
 * For both named modules (via `ngApp` directive) and manually bootstraped modules captured by he wrapped `angular.bootstrap`, a list of dependencies is available, and the `dependencies` property will be populated with instances of `NGI.Dependency`. The dependencies `directive` array will be concatenated into the `NGI.Module` instance's own `directive` array.
 */

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

/*
	Ways a NGI.Module can be instantiated, and the properties they have available
	- dependency from another module: name, dependencies, module, directives
	- ngApp directive: name, module, node
	- anonymous ngApp directive: 
*/

NGI.Module = function(node) {

	// Assigns the incremental ID to the instance, for debugging purposes
	this.id = NGI.newID();

	// The DOM node with the ngApp directive or manually bootstrapped against
	this.node = node;

	// The AngularJS module name
	this.name;

	// Reference to the AngularJS Module instance
	this.ngModule;

	// The tree view item representing this AngularJS module. Only created if
	// `node` is defined
	this.view;

	// An array with `NGI.Directive` instances representing directives that
	// trigger scope creation defined in the module. Used by `NGI.InspectorAgent`
	// to annotate scopes.
	this.directives = [];

	// Array with `NGI.Module` instances
	this.requires = [];

	// If the module has a DOM Node in the page, instantiate the TreeViewItem and
	// inject into the inspector
	if (node) {
		var label = this.name ? this.name : nodeRep(node);
		this.view = NGI.TreeView.moduleItem(label, node);
	}

	//
	this.instantiateDeps = function(deps) {
		if (!deps) return;
		for (var i = 0; i < deps.length; i++) {
			if (typeof deps[i] === typeof '') {
				NGI.Module.instance(null, deps[i]);
			}
		}
	};

};


// A cache with all NGI.Module instances
var moduleCache = [];

// Retrieves or create new instances of `NGI.Module`
NGI.Module.instance = function(node, name) {

	// Ensures only a single `NGI.Module` instance exists for each module node
	for (var i = 0; i < moduleCache.length; i++) {
		if (moduleCache[i].node === node) {
			return moduleCache[i].module;
		}
	};

	var module = new NGI.Module(node);

	// Named modules
	if (typeof name === typeof '') {
		module.name = name;
		module.ngModule = window.angular.module(name);
		module.instantiateDeps(module.ngModule.requires);
	}

	// Names of dependencies
	if (typeof name === typeof {} && name.length) {
		module.instantiateDeps(name);
	}

	moduleCache.push({node:node, module:module});

	return module;
};

/* global NGI */
/* jshint strict: false */
/* jshint boss: true */

NGI.Scope = (function() {

	function Scope(node, ngScope, isIsolate) {
		// Calculate the scope depth in the tree to determine the intendation level
		// in the TreeView
		var depth = -1;
		var reference = ngScope;
		do { depth++; } while (reference = reference.$parent);

		// Instantiate and expose the TreeViewItem representing the scope
		this.view = NGI.TreeView.scopeItem(ngScope.$id, node, depth, isIsolate);

		// Destroy the TreeViewItem when the AngularJS scope is destroyed
		ngScope.$on('$destroy', function() {
			NGI.TreeView.flushNode(node);
		});

		// Keturns the keys for the user defined models in the scope, excluding
		// keys created by AngularJS or the `this` keyword
		function modelKeys() {
			var keys = [];
			for (var key in ngScope) {
				if (ngScope.hasOwnProperty(key) && !/^\$/.test(key) && key !== 'this') {
					keys.push(key);
				}
			}
			return keys;
		}

		// Returns an object representing the keys and values of the user defined
		// models in the scope
		function getModels() {
			var models = {}, keys = modelKeys();
			for (var i = 0; i < keys.length; i++) {
				models[keys[i]] = ngScope[keys[i]];
			}
			return models;
		}

		ngScope.$watch(function() {

		});

	}

	// To easily retrieve an `NGI.Scope` instance by the scope id, we keep a
	// cache of created instances
	var scopeCache = {};

	// Returns an instance of `NGI.Scope` representing the AngularJS scope with
	// the id
	Scope.get = function(id, kind, node) {
		if (!scopeCache[id]) {
			console.warn(kind, id, 'not found in the scope cache. Should be the parent of', id, node);
			throw 'STAHP! CANT FIND SCOPE ' + id + '!';
		}
		return scopeCache[id];
	};

	// This is the method used by `NGI.InspectorAgent` to instantiate the
	// `NGI.Scope` object
	Scope.instance = function(node, ngScope, isIsolate) {
		if (scopeCache[ngScope.$id]) {
			return scopeCache[ngScope.$id];
		}
		var scope = new NGI.Scope(node, ngScope, isIsolate);
		scopeCache[ngScope.$id] = scope;
		return scope;
	};

	return Scope;

})();

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
})(window);