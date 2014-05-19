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
		if (!moduleCache[name]) {
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