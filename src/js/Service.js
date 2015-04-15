/* global NGI */
/* jshint strict: false */
/* jshint shadow: true */

NGI.Service = (function() {

	var CLASS_DIRECTIVE_REGEXP = /(([\d\w\-_]+)(?:\:([^;]+))?;?)/;

	function Service(app, module, invoke) {
		this.provider = invoke[0];
		this.type = invoke[1];
		this.definition = invoke[2];
		this.name = (typeof this.definition[0] === typeof '') ? this.definition[0] : null;
		this.factory = this.definition[1];
		
		switch(this.provider) {
			case '$compileProvider':

				// Unnannotated directives declared in the application will throw an exception.
				// If $injector.annotate is available in the user's version of Angular we
				// attempt to salvage it, otherwise return and ignore the directive.
				if (Object.prototype.toString.call(this.factory) !== '[object Array]') {
					var annotation = NGI.Utils.annotate(this.factory);
					annotation.push(this.factory);
					this.factory = annotation;
				}
				try {
					var dir = app.$injector.invoke(this.factory);
				} catch(e) {
					console.warn(
						'Invalid directive "' + (this.name || '(unknown)') +
						'" found. Make sure all registered directives ' + 
						'return a "Directive Definition Object"'
					);
					return;
				}
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
							var normalized = NGI.Utils.directiveNormalize(node.attributes[i].name);
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
						var normalized = NGI.Utils.directiveNormalize(node.tagName.toLowerCase());
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
								var normalized = NGI.Utils.directiveNormalize(matches[i]);
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
						var normalized = NGI.Utils.directiveNormalize(node.attributes[i].name);
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
