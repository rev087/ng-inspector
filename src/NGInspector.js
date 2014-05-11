var NGInspector = function() {

	this.process = function() {

		// Retrieve the ng-app elements from the DOM
		requestAnimationFrame(function() {

			// Process the auto-bootstrapped module via ngApp
			// (being the first ngApp in the page)
			var el = document.querySelector('[ng-app]');
			if (el) {
				var app = new AppItem(el);
				ngInspector.apps.push(app);
				ngInspector.drawer.appendChild(app.element);
			}

			// Process the asyncronously bootstrapped modules, captured
			// by the angular.bootstrap wrapper below
			for ( var i = 0; i < ngInspector.bootstrappedApps.length; i++ ) {
				var app = new AppItem(ngInspector.bootstrappedApps[i].element);
				ngInspector.apps.push(app);
				ngInspector.drawer.appendChild(app.element);
			}
			ngInspector.element.classList.remove('ngi-processing');
			if (ngInspector.showWarnings) console.timeEnd('ng-inspector');
		});

	};

	// Life cycle
	/////////////

	this.flush = function() {
		while (this.apps.length > 0) {
			var app = this.apps.pop();
			app.destroy();
		}
	};

	return this;
}