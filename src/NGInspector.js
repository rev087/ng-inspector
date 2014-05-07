var NGInspector = function() {

	// Create the inspector view
	this.element = document.createElement('div');
	this.element.className = 'ngi-inspector';
	this.element.innerHTML = '';
	this.element.style.width = localStorage.getItem("inspector-width") + 'px';

	// Create the root node for the ng-app items
	this.drawer = document.createElement('div');
	this.drawer.className = 'app-list';
	this.element.appendChild(this.drawer);

	this.apps = [];
	this.bootstrappedApps = [];

	this.showWarnings = false;

	this.process = function() {
		if (!('angular' in window)) {
			console.warn('This page does not include AngularJS.');
			return;
		}

		if (this.showWarnings) console.time('ng-inspector');
		this.element.classList.add('ngi-processing');

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

	this.toggle = function(settings) {
		if (settings && 'showWarnings' in settings) {
			this.showWarnings = settings.showWarnings;
		} else {
			this.showWarnings = false;
		}

		if ( this.element.parentNode ) {
			document.body.removeChild(this.element);
			this.flush();
		} else {
			document.body.appendChild(this.element);
			this.process();
		}
	};

	// Scrolling
	////////////

	// Capture the mouse wheel while hovering the inspector
	this.element.addEventListener('mousewheel', function(event) {
		if ((event.wheelDeltaY > 0 && ngInspector.scrollTop === 0) ||
			(event.wheelDeltaY < 0 && (
				ngInspector.element.scrollTop + ngInspector.element.offsetHeight) === ngInspector.element.scrollHeight
			)) {
			event.preventDefault();
		}
	});

	// Resizing
	///////////

	this.isResizing = false;
	this.canResize = false;

	document.body.addEventListener('mousemove', function(event) {
		var el = ngInspector.element;

		// Don't do anything if the inspector is detached from the DOM
		if (!el.parentNode) return;

		if (el.offsetLeft - 3 <= event.clientX && event.clientX <= el.offsetLeft + 2) {
			ngInspector.canResize = true;
			document.body.classList.add('ngi-resize');
		} else {
			ngInspector.canResize = false;
			document.body.classList.remove('ngi-resize');
		}
		
		if (ngInspector.isResizing) {
			el.style.width = (document.width - event.clientX) + 'px';
		}
	});

	document.body.addEventListener('mousedown', function(event) {
		if (ngInspector.canResize) {
			ngInspector.isResizing = true;
			document.body.classList.add('ngi-resizing');
		}
	});

	document.body.addEventListener('mouseup', function(event) {
		if (ngInspector.isResizing) {
			ngInspector.isResizing = false;
			document.body.classList.remove('ngi-resizing');
			localStorage.setItem("inspector-width", ngInspector.element.offsetWidth);
		}
	});

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