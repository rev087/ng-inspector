var ScopeItem = function(scope, appItem, parentScopeItem, depth) {
	
	if ( typeof depth === 'undefined' || isNaN(depth) )
		depth = 0;

	this.scope = scope;
	this.appItem = appItem;
	this.parentScopeItem = parentScopeItem;
	this.depth = depth;

	this.element = document.createElement('div');
	this.element.className = 'ngi-scope';

	this.label = document.createElement('label');
	this.label.className = 'ngi-depth-' + depth;
	this.label.innerText = this.scope.$id;
	this.element.appendChild(this.label);

	this.drawer = document.createElement('div');
	this.drawer.className = 'ngi-drawer';
	this.element.appendChild(this.drawer);

	// Find the DOM Node
	////////////////////

	this.node = null;
	this.isIsolate = null;
	this.findDOMNode = function(el) {

		$el = angular.element(el);

		// Check for a match in the element isolate scope
		if ('isolateScope' in $el) {
			var $isolateScope = $el.isolateScope();
			if ($isolateScope && $isolateScope.$id === this.scope.$id) {
				this.node = el;
				this.isIsolate = true;
				return true;
			}
		}

		// Check for a match in the element scope
		if ('scope' in $el) {
			// .data('$scope') is more efficient than .scope() as it doesn't
			// traverse the DOM up
			var $scope = $el.data('$scope');
			if ($scope && $scope.$id === this.scope.$id) {
				this.node = el;
				this.isIsolate = false;
				return true;
			}
		}

		// No match, look deeper
		var children = el.querySelectorAll('.ng-scope, .ng-isolate-scope');
		for (var i = 0; i < children.length; i++) {
			var match = this.findDOMNode(children[i]);
			if (match) return true;
		}

		return false;
	};
	if (this.parentScopeItem && this.parentScopeItem.node)
		this.findDOMNode(this.parentScopeItem.node);
	else
		this.findDOMNode(this.appItem.node);

	if (!this.node && ngInspector.showWarnings) {
		console.warn('ng-inspector: No DOM node found for scope ' + this.scope.$id);
	}

	if (this.isIsolate) this.element.classList.add('ngi-isolate-scope');

	// Association labels
	/////////////////////

	this.assocLabels = [];
	this.addAssociation = function(text, isBuiltIn) {
		if (this.assocLabels.indexOf(text) < 0) {
			this.assocLabels.push(text);
		} else {
			return;
		}
		var span = document.createElement('span');
		span.className = 'ngi-assoc';
		span.innerText = text;
		if (isBuiltIn) span.classList.add('ngi-minor-assoc');
		this.label.appendChild(span);
	};

	var assoc = this.appItem.associations;

	// Controllers
	for ( var i = 0; i < assoc.controllers.length; i++) {
		var name = assoc.controllers[i];
		if (this.node && this.node.getAttribute('ng-controller') === name) {
			this.addAssociation(name);
		}
	}

	// Directives, restrict: A
	for ( var i = 0; i < assoc.directives.A.length; i++) {
		var desc = assoc.directives.A[i];
		if (this.node && this.node.hasAttribute(desc.dasherized) &&
			this.isIsolate === desc.isIsolate) {
			this.addAssociation(desc.name, desc.isBuiltIn);
		}
	}
	// Directives, restrict: E
	for ( var i = 0; i < assoc.directives.E.length; i++) {
		var desc = assoc.directives.E[i];
		if (this.node &&
			this.node.tagName.toLowerCase() === desc.dasherized.toLowerCase() &&
			this.isIsolate === desc.isIsolate) {
			this.addAssociation(desc.name, desc.isBuiltIn);
		}
	}

	// Label ng-repeat items
	if (this.node && this.node.hasAttribute('ng-repeat')) {
		this.addAssociation('ngRepeat', true);
	}

	// Label ng-include scopes
	if (this.node && this.node.hasAttribute('ng-include')) {
		this.addAssociation('ngInclude', true);
	}

	// Label ng-if scopes
	if (this.node && this.node.hasAttribute('ng-if')) {
		this.addAssociation('ngIf', true);
	}

	// Label root scopes
	if (this.scope.$root.$id === this.scope.$id) {
		this.addAssociation('$rootScope', true);
	}

	// Label ng-transclude scopes
	if (this.node && this.node.parentNode && this.node.parentNode.hasAttribute &&
		this.node.parentNode.hasAttribute('ng-transclude')) {
		this.addAssociation('ngTransclude', true);
	}

	// Models
	/////////

	this.models = [];

	this.addModel = function(key) {
		var model = new ModelItem(this.scope, key, this.depth + 1);
		this.models.push(model);
		this.drawer.appendChild(model.element);
	};

	this.getModelKeys = function() {
		var models = [];
		for (key in this.scope) {
			if (this.scope.hasOwnProperty(key) && !/^\$/.test(key) && key !== 'this') {
				models.push(key);
			}
		}
		return models;
	};

	this.processModels = function() {
		var keys = this.getModelKeys();
		for (var i = 0; i < keys.length; i++) this.addModel(keys[i])
	};
	this.processModels();

	this.getModels = function() {
		var models = {}, keys = this.getModelKeys();
		for (var i = 0; i < keys.length; i++) {
			models[keys[i]] = this.scope[keys[i]];
		}
		return models;
	}

	this.updateModels = function() {
		for (var i = 0; i < this.models.length; i++) {
			this.models[i].process();
		}
	}

	// Child scopes
	///////////////

	this.processChildScopes = function() {
		// No children? Nothing to see here citizen, move along.
		if ( !this.scope.$$childHead ) return;

		var childScope = this.scope.$$childHead;

		do {
			var childItem = new ScopeItem(childScope, this.appItem, this, this.depth + 1);
			this.drawer.appendChild(childItem.element);
		} while (childScope = childScope.$$nextSibling);
	};
	this.processChildScopes();

	this.getChildScopes = function() {
		if (!this.scope.$$childHead) return [];
		var childScopes = [];
		var childScope = this.scope.$$childHead;
		do {
			childScopes.push(childScope);
		} while (childScope = childScope.$$nextSibling);
		return childScopes;
	}

	// Events
	/////////

	var scopeItem = this;

	this.scope.$on('$destroy', function() {
		scopeItem.destroy();
	})

	// Highlight DOM elements the scope is attached to when hovering the item
	// in the inspector
	this.label.addEventListener('mouseover', function() {
		if ( !ngInspector.isResizing && scopeItem.node )
			scopeItem.node.classList.add('ngi-highlight');
	});
	this.label.addEventListener('mouseout', function() {
		if ( scopeItem.node )
			scopeItem.node.classList.remove('ngi-highlight');
	});

	// console.log the DOM element the scope is attached to
	this.label.addEventListener('click', function(event) {
		// scopeItem.drawer.classList.toggle('ngi-collapsed'); // toggle drawer
		console.log(scopeItem.node);
	}, true);

	// Check for changes in every digest cycle
	this.oldModels = this.getModels();
	this.oldChildScopes = this.getChildScopes();
	this.watcherDestructor = this.scope.$watch(function() {

		// Models
		var newModels = scopeItem.getModels();
		if (!angular.equals(scopeItem.oldModels, newModels)) {
			scopeItem.updateModels();
		}
		scopeItem.oldModels = newModels;

		// Child scopes
		var newChildScopes = scopeItem.getChildScopes();
		if (!angular.equals(scopeItem.oldChildScopes, newChildScopes)) {

			// Removals are handled by the scopes, since angular emits a
			// $destroy event.
			for (var i = 0; i < newChildScopes.length; i++) {
				var added = scopeItem.oldChildScopes.indexOf(newChildScopes[i]) < 0;
				if ( added ) {
					var childItem = new ScopeItem(newChildScopes[i], scopeItem.appItem, scopeItem, scopeItem.depth + 1);
					scopeItem.drawer.appendChild(childItem.element);
				}
			}
		}
		scopeItem.oldChildScopes = newChildScopes;
	});

	// Destructor
	/////////////

	this.destroy = function() {
		while (this.models.length > 0) {
			var m = this.models.pop();
			m.destroy();
		}
		this.watcherDestructor();
		this.element.parentNode.removeChild(this.element);
	}

	return this;
}
