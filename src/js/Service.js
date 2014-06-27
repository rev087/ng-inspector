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
