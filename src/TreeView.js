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