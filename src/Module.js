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