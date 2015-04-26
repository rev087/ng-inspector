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
			if (this.element.parentNode) {
				this.element.parentNode.removeChild(this.element);
			}
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
			span.textContent = name;
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
		item.label.className = 'ngi-depth-' + depth.length;

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
		item.label.className = 'ngi-depth-' + depth.length;

		item.label.addEventListener('click', function() {
			console.log(value);
		});

		return item;
	};

	return TreeView;

})();
