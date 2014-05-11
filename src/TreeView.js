/* global NGI, console */
/* jshint strict: false */
/* jshint expr: true */

NGI.TreeView = (function() {

	function TreeViewItem(label) {

		this.element = document.createElement('div');

		this.label = document.createElement('label');
		this.label.innerHTML = label;
		this.element.appendChild(this.label);

		this.drawer = document.createElement('div');
		this.drawer.className = 'ngi-drawer';
		this.element.appendChild(this.drawer);

		this.addChild = function(childItem) {
			this.drawer.appendChild(childItem.element);
		};

		this.destroy = function() {
			this.element.parentNode.removeChild(this.element);
		};

		var treeViewItem = this;

		this.label.addEventListener('click', function() {
			console.log(treeViewItem.node);
		});

		// Highlight DOM elements the scope is attached to when hovering the item
		// in the inspector
		this.label.addEventListener('mouseover', function() {
			if ( treeViewItem.node && !window.ngInspector.pane.isResizing ) {
				treeViewItem.node.classList.add('ngi-highlight');
			}
		});

		this.label.addEventListener('mouseout', function() {
			if (treeViewItem.node) {
				treeViewItem.node.classList.remove('ngi-highlight');
			}
		});
	}

	function TreeView() {}

	// Creates a new TreeViewInstance, with styling and metadata relevant for
	// AngularJS modules
	TreeView.moduleItem = function(label, node) {
		if (node === document) node = document.querySelector('html');
		var item = new TreeViewItem(label);
		item.node = node;
		item.element.className = 'ngi-app';
		return item;
	};

	// Creates a new TreeViewInstance, with styling and metadata relevant for
	// AngularJS scopes
	TreeView.scopeItem = function(label, depth, isIsolate) {
		var item = new TreeViewItem(label);
		item.element.className = 'ngi-scope';
		if (isIsolate) {
			item.element.classList.add('ngi-isolate-scope');
		}
		item.label.className = 'ngi-depth-' + depth;
		return item;
	};

	return TreeView;

})();