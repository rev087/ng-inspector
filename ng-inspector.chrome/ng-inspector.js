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

	this.pane = new NGI.InspectorPane();

	// The actual toggling is done by the `NGI.InspectorPane`. Since the
	// `ng-inspector.js` script is injected into the page DOM with no direct
	// access to `safari.extension.settings`, settings can only be sent via
	// messages. To save on the number of messages sent back and forth between
	// this injected script and the browser extension, the browser settings are
	// sent along with the toggle command. A side effect is that changes in the
	// settings only take place after a toggle is triggered.
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
	window.$scopeId = function(id) {

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
						setTimeout(traverse.bind(this, child, app));
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
			var scopeRep = NGI.Scope.instance(app, ngScope);
			scopeRep.startObserver();

			if (ngScope.$parent) {
				var parent = NGI.Scope.get(ngScope.$parent.$id).view;
				parent.addChild(scopeRep.view);
			} else {
				app.view.addChild(scopeRep.view);
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

	InspectorAgent.findApps = function () {

		var nodeQueue = 1;

		// DOM Traversal to find AngularJS App root elements. Traversal is
		// interrupted when an App is found (traversal inside the App is done by the
		// InspectorAgent.inspectApp method)
		function traverse(node) {

			if (node.nodeType === Node.ELEMENT_NODE ||
				 node.nodeType === Node.DOCUMENT_NODE) {

				var $node = window.angular.element(node);

				if ($node.data('$injector')) {
					NGI.App.bootstrap(node);
				} else if (node.firstChild) {
					var child = node.firstChild;
					do {
						nodeQueue++;
						setTimeout(traverse.bind(this, child), 4);
					} while (child = child.nextSibling);
				}

				nodeQueue--;
				if (--nodeQueue === 0) {
					// Done
				}
			}
		}

		traverse(document);
	};

	return InspectorAgent;
})();

/* global NGI */
/* jshint strict: false */

/**
 * `NGI.InspectorPane` is responsible for the root element and basic interaction
 * with the pane (in practice, a <div>) injected in the page DOM, such as
 * toggling the pane on and off, handle mouse scrolling, resizing and first
 * level of child views.
 */

NGI.InspectorPane = function() {

	// The width of the pane can be resized by the user, and is persisted via
	// localStorage
	var inspectorWidth = localStorage.getItem('ng-inspector-width') || 300;

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

	this.clear = function() {
		while(this.treeView.lastChild) {
			this.treeView.removeChild(this.treeView.lastChild);
		}
	};

	// Used to avoid traversing or inspecting the extension UI
	this.contains = function(node) {
		return this.treeView.contains(node);
	};

	this.visible = false;

	// Toggle the inspector pane on and off. Returns a boolean representing the
	// new visibility state.
	this.toggle = function() {
		if ( pane.parentNode ) {
			this.visible = false;
			document.body.removeChild(pane);
			this.clear();
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mousedown', onMouseDown);
			document.removeEventListener('mouseup', onMouseUp);
			window.removeEventListener('resize', onResize);
			return false;
		} else {
			this.visible = true;
			document.body.appendChild(pane);
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mousedown', onMouseDown);
			document.addEventListener('mouseup', onMouseUp);
			window.addEventListener('resize', onResize);
			return true;
		}
	};

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

	// States for the inspector pane resizing functionality
	var isResizing = false;
	var canResize = false;

	// Defines how many pixels to the left and right of the border of the pane
	// are considered within the resize handle
	var LEFT_RESIZE_HANDLE_PAD = 3;
	var RIGHT_RESIZE_HANDLE_PAD = 2;

	// Listen for mousemove events in the page body, setting the canResize state
	// if the mouse hovers close to the 
	function onMouseMove(event) {

		// Don't do anything if the inspector is detached from the DOM
		if (!pane.parentNode) return;

		// Check if the mouse cursor is currently hovering the resize handle,
		// consisting of the vertical pixel column of the inspector border plus
		// a pad of pixel columns to the left and right. The class added to
		// the page body is used for styling the cursor to `col-resize`
		if (pane.offsetLeft - LEFT_RESIZE_HANDLE_PAD <= event.clientX &&
			event.clientX <= pane.offsetLeft + RIGHT_RESIZE_HANDLE_PAD) {
			canResize = true;
			document.body.classList.add('ngi-resize');
		} else {
			canResize = false;
			document.body.classList.remove('ngi-resize');
		}
		
		// If the user is currently performing a resize, the width is adjusted
		// based on the cursor position
		if (isResizing) {

			var width = (window.innerWidth - event.clientX);

			// Enforce minimum and maximum limits
			if (width >= window.innerWidth - 50) {
				width = window.innerWidth - 50;
			} else if (width <= 100) {
				width = 100;
			}

			pane.style.width = width + 'px';
		}
	}

	// Listen to mousedown events in the page body, triggering the resize mode
	// (isResizing) if the cursor is within the resize handle (canResize). The
	// class added to the page body styles it to disable text selection while the
	// user dragging the mouse to resize the pane
	function onMouseDown() {
		if (canResize) {
			isResizing = true;
			document.body.classList.add('ngi-resizing');
		}
	}
	

	// Listen to mouseup events on the page, turning off the resize mode if one
	// is underway. The inspector width is then persisted in the localStorage
	function onMouseUp() {
		if (isResizing) {
			isResizing = false;
			document.body.classList.remove('ngi-resizing');
			localStorage.setItem('ng-inspector-width', pane.offsetWidth);
		}
	}

	// If the user contracts the window, this makes sure the pane won't end up
	// wider thant the viewport
	function onResize() {
		if (pane.offsetWidth >= document.body.offsetWidth - 50) {
			pane.style.width = (document.body.offsetWidth - 50) + 'px';
		}
	}

};

/* global NGI, console */
/* jshint strict: false */
/* jshint expr: true */
/* jshint boss: true */

NGI.TreeView = (function() {

	function TreeViewItem(label) {

		this.element = document.createElement('div');

		this.label = document.createElement('label');
		this.label.innerHTML = label;
		this.element.appendChild(this.label);

		this.drawer = document.createElement('div');
		this.drawer.className = 'ngi-drawer';
		this.element.appendChild(this.drawer);

		this.caret = document.createElement('span');
		this.caret.className = 'ngi-caret';

		this.length = null;

		var collapsed = false;
		this.setCollapsed = function(newState) {
			if (collapsed = newState) {
				this.element.classList.add('ngi-collapsed');
				this.element.classList.remove('ngi-expanded');
			} else {
				this.element.classList.remove('ngi-collapsed');
				this.element.classList.add('ngi-expanded');
			}
		};
		this.toggle = function(e) {
			e.stopPropagation();
			this.setCollapsed(!collapsed);
		};
		this.caret.addEventListener('click', this.toggle.bind(this));

		var isCollapsible = false;
		this.makeCollapsible = function(collapsibleState, initialState) {
			if (isCollapsible == collapsibleState) {
				return;
			}
			if (isCollapsible = collapsibleState) {
				this.label.appendChild(this.caret);
				this.setCollapsed(initialState || false);
			} else {
				this.label.removeChild(this.caret);
			}
		}

		this.addChild = function(childItem, top) {
			if (!!top) {
				this.drawer.insertBefore(childItem.element, this.drawer.firstChild);
			} else {
				this.drawer.appendChild(childItem.element);
			}
		};

		this.removeChildren = function(className) {
			for (var i = this.drawer.childNodes.length - 1; i >= 0; i--) {
				var child = this.drawer.childNodes[i];
				if (child.classList.contains(className)) {
					this.drawer.removeChild(child);
				}
			}
		};

		this.destroy = function() {
			this.element.parentNode.removeChild(this.element);
		};

		// Pill indicator
		var indicator = false;
		this.setIndicator = function(value) {
			if (indicator && typeof value !== 'number' && typeof value !== 'string') {
				indicator.parentNode.removeChild(indicator);
			} else {
				if (!indicator) {
					indicator = document.createElement('span');
					indicator.className = 'ngi-indicator';
					indicator.innerHTML = value;
					this.label.appendChild(indicator);
				}
			}
		};

		// Annotations (controller names, custom and built-in directive names)
		var annotations = [];
		this.addAnnotation = function(name, type) {
			if (annotations.indexOf(name) < 0) {
				annotations.push(name);
			} else {
				return;
			}
			var span = document.createElement('span');
			span.className = 'ngi-annotation';
			span.innerText = name;
			switch(type) {
				case NGI.Service.DIR:
					span.classList.add('ngi-annotation-dir');
					break;
				case NGI.Service.BUILTIN:
					span.classList.add('ngi-annotation-builtin');
					break;
				case NGI.Service.CTRL:
					span.classList.add('ngi-annotation-ctrl');
					break;
			}
			this.label.appendChild(span);
		};

		// Model types
		var type = null;
		this.setType = function(newType) {
			if (type) {
				this.element.classList.remove(type);
			}
			this.element.classList.add(newType);
			type = newType;
		};

	}

	function TreeView() {}

	// Creates a TreeViewItem instance, with styling and metadata relevant for
	// AngularJS apps
	TreeView.appItem = function(label, node) {
		if (node === document) node = document.querySelector('html');
		var item = new TreeViewItem(label);
		item.node = node;
		item.element.className = 'ngi-app';
		return item;
	};

	// Creates a TreeViewItem instance, with styling and metadata relevant for
	// AngularJS scopes
	TreeView.scopeItem = function(label, depth, isIsolate) {
		var item = new TreeViewItem(label);
		item.element.className = 'ngi-scope';
		item.makeCollapsible(true, false);
		if (isIsolate) {
			item.element.classList.add('ngi-isolate-scope');
		}
		item.label.className = 'ngi-depth-' + depth;

		// Highlight DOM elements the scope is attached to when hovering the item
		// in the inspector
		item.label.addEventListener('mouseover', function(event) {
			var isCaret = event.target && event.target.classList.contains('ngi-caret');
			if ( item.node && !window.ngInspector.pane.isResizing && !isCaret) {
				var target = (item.node === document) ?
					document.querySelector('html') : item.node;
				// target.classList.add('ngi-highlight');
				NGI.Highlighter.hl(target);
			}
		});
		item.label.addEventListener('mouseout', function() {
			if (item.node) {
				NGI.Highlighter.clear();
			}
		});

		// console.log the DOM Node this scope is attached to
		item.label.addEventListener('click', function() {
			console.log(item.node);
		});

		return item;
	};

	// Creates a TreeViewItem instance, with styling and metadata relevant for
	// AngularJS models
	TreeView.modelItem = function(key, value, depth) {
		var item = new TreeViewItem(key + ':');
		item.element.className = 'ngi-model';
		item.label.className = 'ngi-depth-' + depth;

		item.label.addEventListener('click', function() {
			console.log(value);
		});

		return item;
	};

	return TreeView;

})();

/* global NGI */
/* jshint strict: false */
/* jshint expr: true */
/* jshint boss: true */

NGI.Highlighter = (function() {

	function Highlighter() {}

	function offsets(node) {
		var vals = {
			x: node.offsetLeft,
			y: node.offsetTop,
			w: node.offsetWidth,
			h: node.offsetHeight
		};
		while (node = node.offsetParent) {
			vals.x += node.offsetLeft;
			vals.y += node.offsetTop;
		}
		return vals;
	}

	var hls = [];
	Highlighter.hl = function(node, label) {
		var box = document.createElement('div');
		box.className = 'ngi-hl ngi-hl-scope';
		if (label) {
			box.innerText = label;
		}
		var pos = offsets(node);
		box.style.left = pos.x + 'px';
		box.style.top = pos.y + 'px';
		box.style.width = pos.w + 'px';
		box.style.height = pos.h + 'px';
		document.body.appendChild(box);
		hls.push(box);
		return box;
	};

	Highlighter.clear = function() {
		var box;
		while (box = hls.pop()) {
			box.parentNode.removeChild(box);
		}
	};

	return Highlighter;

})();

/* global NGI */
/* jshint strict: false */
/* jshint shadow: true */

NGI.Service = (function() {

	var PREFIX_REGEXP = /^(x[\:\-_]|data[\:\-_])/i;
	/**
	 * Converts all accepted directives format into proper directive name.
	 * All of these will become 'myDirective':
	 *   my:Directive
	 *   my-directive
	 *   x-my-directive
	 *   data-my:directive
	 */
	function directiveNormalize(name) {
	  return camelCase(name.replace(PREFIX_REGEXP, ''));
	}

	var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
	var MOZ_HACK_REGEXP = /^moz([A-Z])/;

	/**
	 * Converts snake_case to camelCase.
	 * Also there is special case for Moz prefix starting with upper case letter.
	 * @param name Name to normalize
	 */
	function camelCase(name) {
	  return name.
	    replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
	      return offset ? letter.toUpperCase() : letter;
	    }).
	    replace(MOZ_HACK_REGEXP, 'Moz$1');
	}

	var CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/;

	function Service(app, module, invoke) {
		this.provider = invoke[0];
		this.type = invoke[1];
		this.definition = invoke[2];
		this.name = (typeof this.definition[0] === typeof '') ? this.definition[0] : null;
		this.factory = this.definition[1];
		
		switch(this.provider) {
			case '$compileProvider':
				var dir = app.$injector.invoke(this.factory);
				var restrict = dir.restrict || 'A';
				var name = this.name;

				app.registerProbe(function(node, scope, isIsolate) {

					if (node === document) {
						node = document.getElementsByTagName('html')[0];
					}

					// Test for Attribute Comment directives (with replace:true for the
					// latter)
					if (restrict.indexOf('A') > -1 ||
						(dir.replace === true && restrict.indexOf('M') > -1)) {
						for (var i = 0; i < node.attributes.length; i++) {
							var normalized = directiveNormalize(node.attributes[i].name);
							if (normalized === name) {
								if (!isIsolate && dir.scope === true ||
									isIsolate && typeof dir.scope === typeof {}) {
									scope.view.addAnnotation(name, Service.DIR);
								}
							}
						}
					}

					// Test for Element directives
					if (restrict.indexOf('E') > -1) {
						var normalized = directiveNormalize(node.tagName.toLowerCase());
						if (normalized === name) {
							if (!isIsolate && dir.scope === true ||
								isIsolate && typeof dir.scope === typeof {}) {
								scope.view.addAnnotation(name, Service.DIR);
							}
						}
					}

					// Test for Class directives
					if (restrict.indexOf('C') > -1) {
						var matches = CLASS_DIRECTIVE_REGEXP.exec(node.className);
						if (matches) {
							for (var i = 0; i < matches.length; i++) {
								if (!matches[i]) continue;
								var normalized = directiveNormalize(matches[i]);
								if (normalized === name) {
									if (!isIsolate && dir.scope === true ||
										isIsolate && typeof dir.scope === typeof {}) {
										scope.view.addAnnotation(name, Service.DIR);
									}
								}
							}
						}
					}

				});
				break;
			case '$controllerProvider':

				app.registerProbe(function(node, scope) {

					if (node === document) {
						node = document.getElementsByTagName('html')[0];
					}

					// Test for the presence of the ngController directive
					for (var i = 0; i < node.attributes.length; i++) {
						var normalized = directiveNormalize(node.attributes[i].name);
						if (normalized === 'ngController') {
							scope.view.addAnnotation(node.attributes[i].value, Service.CTRL);
						}
					}

				});

				break;
		}
	}

	Service.CTRL = 1;
	Service.DIR = 2;
	Service.BUILTIN = 4;

	Service.parseQueue = function(app, module) {
		var arr = [],
				queue = module._invokeQueue,
				tempQueue, i, j;
		for (i = 0; i < queue.length; i++) {
			if (queue[i][2].length === 1 && !(queue[i][2][0] instanceof Array)) {
				for (j in queue[i][2][0]) {
					if (Object.hasOwnProperty.call(queue[i][2][0], j)) {
						tempQueue = queue[i].slice();
						tempQueue[2] = [Object.keys(queue[i][2][0])[j], queue[i][2][0][j]];
						arr.push(new Service(app, module, tempQueue));
					}
				}
			} else {
				arr.push(new Service(app, module, queue[i]));
			}
		}
		return arr;
	};

	return Service;

})();


/* global NGI */
/* jshint strict: false */
/* jshint expr: true */

NGI.App = (function(window) {

	function App(node, modules) {
		var pane = window.ngInspector.pane;
		var app = this;
		var observer = new MutationObserver(function(mutations) {
			setTimeout(function() {
				for (var i = 0; i < mutations.length; i++) {
					var target = mutations[i].target;

					// Avoid responding to mutations in the extension UI
					if (!pane.contains(target)) {
						for (var f = 0; f < mutations[i].addedNodes.length; f++) {
							var addedNode = mutations[i].addedNodes[f];
							if (addedNode.classList && !addedNode.classList.contains('ngi-hl')) {
								NGI.InspectorAgent.inspectNode(app, addedNode);
							}
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

		this.$injector = window.angular.element(node).data('$injector');
		
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
		var newApp = new App(node, modules);
		if (window.ngInspector.pane.visible) {
			NGI.InspectorAgent.inspectApp(newApp);
			newApp.startObserver();
		}
		appCache.push(newApp);
	};

	var didFindApps = false;

	App.inspectApps = function() {
		if (!didFindApps) {
			NGI.InspectorAgent.findApps();
			didFindApps = true;
		}

		for (var i = 0; i < appCache.length; i++) {
			NGI.InspectorAgent.inspectApp(appCache[i]);
			appCache[i].startObserver();
		}
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

/* global NGI */
/* jshint strict: false */
/* jshint expr: true */

NGI.Module = (function() {

	function Module(app, name) {

		// The AngularJS module name
		this.name = name;

		// Array with `NGI.Module` instance references
		this.requires = [];

		// The AngularJS module instance
		this.ngModule = window.angular.module(name);

		// `NGI.Service` instances representing services defined in this module
		this.services = NGI.Service.parseQueue(app, this.ngModule);
	}

	// A cache with all NGI.Module instances
	var moduleCache = [];

	Module.register = function(app, name) {
		// Ensure only a single `NGI.Module` instance exists for each AngularJS
		// module name
		if (typeof name === typeof '' && !moduleCache[name]) {
			moduleCache[name] = new Module(app, name);

			// Register the dependencies
			var requires = moduleCache[name].ngModule.requires;
			for (var i = 0; i < requires.length; i++) {
				var dependency = Module.register(app, requires[i]);
				moduleCache[name].requires.push(dependency);
			}
		}

		return moduleCache[name];
	};

	return Module;

})();

/* global NGI */
/* jshint strict: false */

NGI.ModelMixin = (function() {

	// Keturns the keys for the user defined models in the scope excluding keys
	// created by AngularJS or the `this` keyword, or the elements
	// in an array or object
	function getKeys(values) {
		var keys = [];
		for (var key in values) {
			if (values.hasOwnProperty(key) && !/^\$/.test(key) && key !== 'this') {
				keys.push(key);
			}
		}
		return keys;
	}

	function arrayDiff(a, b) {
		var i, ret = { added: [], removed: [], existing: [] };

		// Iterate through b checking for added and existing elements
		for (i = 0; i < b.length; i++) {
			if (a.indexOf(b[i]) < 0) {
				ret.added.push(b[i]);
			} else {
				ret.existing.push(b[i]);
			}
		}

		// Iterate through a checking for removed elements
		for (i = 0; i < a.length; i++) {
			if (b.indexOf(a[i]) < 0) {
				ret.removed.push(a[i]);
			}
		}

		return ret;
	}

	function ModelMixin() {}

	ModelMixin.update = function(values, depth) {

		if (typeof this.modelObjs === 'undefined') this.modelObjs = {};
		if (typeof this.modelKeys === 'undefined') this.modelKeys = [];

		var newKeys = getKeys(values),
				diff = arrayDiff(this.modelKeys, newKeys),
				i, key;

		// Removed keys
		for (i = 0; i < diff.removed.length; i++) {
			var key = diff.removed[i];
			this.modelObjs[key].view.destroy();
			delete this.modelObjs[key];
		}
		
		// New keys
		for (i = 0; i < diff.added.length; i++) {
			key = diff.added[i];
			this.modelObjs[key] = NGI.Model.instance(key, values[key], depth + 1);
			var insertAtTop = this instanceof NGI.Scope;
			this.view.addChild(this.modelObjs[key].view, insertAtTop);
		}

		// Updated keys
		for (i = 0; i < diff.existing.length; i++) {
			key = diff.existing[i];
			if (!this.modelObjs[key]) {
				var inst = this instanceof NGI.Scope ? 'Scope' : this instanceof NGI.Model ? 'Model' : 'UNKNOWN INSTANCE';
				continue;
			}
			this.modelObjs[key].setValue(values[key]);
		}

		this.modelKeys = newKeys;
	};

	ModelMixin.extend = function(obj) {
		obj.update = ModelMixin.update.bind(obj);
	};

	return ModelMixin;

})();

/* global NGI */
/* jshint strict: false */
/* jshint boss: true */

NGI.Scope = (function() {

	function Scope(app, ngScope, isIsolate) {

		var angular = window.angular;

		this.app = app;
		this.ngScope = ngScope;

		// Calculate the scope depth in the tree to determine the intendation level
		// in the TreeView
		var depth = 0;
		var reference = ngScope;
		while (reference = reference.$parent) { depth++; }

		// Instantiate and expose the TreeViewItem representing the scope
		var view = this.view = NGI.TreeView.scopeItem(ngScope.$id, depth, isIsolate);
		if (isIsolate) this.view.element.classList.add('ngi-isolate-scope');

		// Called when the `NGI.InspectorAgent` DOM traversal finds a Node match
		// for the scope
		this.setNode = function(node) {
			this.node = this.view.node = node;
		};

		function childScopeIds() {
			if (!ngScope.$$childHead) return [];
			var childKeys = [];
			var childScope = ngScope.$$childHead;
			do {
				childKeys.push(childScope.$id);
			} while (childScope = childScope.$$nextSibling);
			return childKeys;
		}

		var oldChildIds = childScopeIds();

		var destroyDeregister = angular.noop;
		var watchDeregister = angular.noop;
		var observerOn = false;

		NGI.ModelMixin.extend(this);
		this.update(ngScope, depth);

		this.startObserver = function() {
			if (observerOn === false) {
				var scopeObj = this;
				destroyDeregister = ngScope.$on('$destroy', function() {
					view.destroy();
				});
				watchDeregister = ngScope.$watch(function() {

					// Scopes: basic check for mutations in the direct child scope list
					var newChildIds = childScopeIds();
					if (!angular.equals(oldChildIds, newChildIds)) {
						NGI.InspectorAgent.inspectScope(app, ngScope);
					}
					oldChildIds = newChildIds;

					// Models
					scopeObj.update(ngScope, depth);

				});
				observerOn = true;
			}
		};

		this.stopObserver = function() {
			if (observerOn === true) {
				if (typeof destroyDeregister === 'function') {
					destroyDeregister.apply();
				}
				if (typeof watchDeregister === 'function') {
					watchDeregister.apply();
				}
				observerOn = false;
			}
		};

	}

	// To easily retrieve an `NGI.Scope` instance by the scope id, we keep a
	// cache of created instances
	var scopeCache = {};

	// Expose stopObservers to stop observers from all scopes in `scopeCache` when
	// the inspector pane is toggled off
	Scope.stopObservers = function() {
		for (var i = 0; i < scopeCache.length; i++) {
			scopeCache[i].stopObserver();
		}
	};

	// Returns an instance of `NGI.Scope` representing the AngularJS scope with
	// the id
	Scope.get = function(id) {
		return scopeCache[id];
	};

	// This is the method used by `NGI.InspectorAgent` to instantiate the
	// `NGI.Scope` object
	Scope.instance = function(app, ngScope, isIsolate) {
		if (scopeCache[ngScope.$id]) {
			return scopeCache[ngScope.$id];
		}
		var scope = new NGI.Scope(app, ngScope, isIsolate);
		scopeCache[ngScope.$id] = scope;
		return scope;
	};

	return Scope;

})();

/* global NGI */
/* jshint strict: false */

NGI.Model = (function() {

	function Model(key, value, depth) {

		this.key = key;
		this.value = value;

		this.view = NGI.TreeView.modelItem(key, value, depth);

		var valSpan = document.createElement('span');
		valSpan.className = 'ngi-value';

		NGI.ModelMixin.extend(this);

		this.setValue = function(newValue) {

			this.value = value = newValue;

			// String
			if (angular.isString(value)) {
				this.view.setType('ngi-model-string');
				if (value.trim().length > 25) {
					valSpan.innerText = '"' + value.trim().substr(0, 25) + ' (...)"';
					this.view.setIndicator(value.length);
				}
				else {
					valSpan.innerText = '"' + value.trim() + '"';
				}
			}

			// Function
			else if (angular.isFunction(value)) {
				this.view.setType('ngi-model-function');
				var args = angular.injector().annotate(value).join(', ');
				valSpan.innerText = 'function(' + args + ') {...}';
			}

			// Array
			else if (angular.isArray(value)) {
				this.view.setType('ngi-model-array');
				var length = value.length;
				if (length === 0) {
					valSpan.innerText = '[ ]';
				}
				else {
					valSpan.innerText = '[...]';
					this.view.setIndicator(length);
				}
				this.view.makeCollapsible(true, true);
				this.update(value, depth + 1);
			}

			// Object
			else if (angular.isObject(value)) {
				this.view.setType('ngi-model-object');
				var length = Object.keys(value).length;
				if (length === 0) {
					valSpan.innerText = '{ }';
				}
				else {
					valSpan.innerText = '{...}';
					this.view.setIndicator(length);
				}
				this.view.makeCollapsible(true, true);
				this.update(value, depth + 1);
			}

			// Boolean
			else if (typeof value === 'boolean') {
				this.view.setType('ngi-model-boolean');
				valSpan.innerText = value;
			}

			// Number
			else if (angular.isNumber(value)) {
				this.view.setType('ngi-model-number');
				valSpan.innerText = value;
			}

			// DOM Element
			else if (angular.isElement(value)) {
				this.view.setType('ngi-model-element');
				valSpan.innerText = '<' + value.tagName + '>';
			}

			// NULL
			else if (value === null) {
				this.view.setType('ngi-model-null');
				valSpan.innerText = 'null';
			}

			// Undefined
			else {
				this.view.setType('ngi-model-undefined');
				valSpan.innerText = 'undefined';
			}

		};
		this.setValue(value);

		this.view.label.appendChild(document.createTextNode(' '));
		this.view.label.appendChild(valSpan);
	}

	Model.instance = function(scope, key, value, depth) {
		return new Model(scope, key, value, depth);
	};

	return Model;

})();

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

			// Continue with angular's native bootstrap method
			var ret = _bootstrap.apply(this, arguments);

			// The dependencies are regitered by the `NGI.Module` object
			NGI.App.bootstrap(node, modules);

			return ret;
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
})(window);