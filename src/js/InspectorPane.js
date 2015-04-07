/* global NGI */
/* jshint strict: false */

/**
 * `NGI.InspectorPane` is responsible for the root element and basic interaction
 * with the pane (in practice, a <div>) injected in the page DOM, such as
 * toggling the pane on and off, handle mouse scrolling, resizing and first
 * level of child views.
 */

NGI.InspectorPane = function() {

	// The width of the pane can be resized by the user, and is persisted via
	// localStorage
	var inspectorWidth = localStorage.getItem('ng-inspector-width') || 300;

	// Quicker reference to body through-out InspectorPane lexical scope
	var body = document.body;

	// Create the root DOM node for the inspector pane
	var pane = document.createElement('div');
	pane.className = 'ngi-inspector';
	pane.innerHTML = '';
	pane.style.width = inspectorWidth + 'px';

	// Create and expose the root DOM node for the treeView
	this.treeView = document.createElement('div');
	pane.appendChild(this.treeView);

	this.addView = function(view) {
		pane.appendChild(view);
	};

	this.clear = function() {
		while(this.treeView.lastChild) {
			this.treeView.removeChild(this.treeView.lastChild);
		}
	};

	// Used to avoid traversing or inspecting the extension UI
	this.contains = function(node) {
		return this.treeView.contains(node);
	};

	this.visible = false;

	// Toggle the inspector pane on and off. Returns a boolean representing the
	// new visibility state.
	this.toggle = function() {
		var events = {
			mousemove: {fn: onMouseMove, target: document},
			mousedown: {fn: onMouseDown, target: document},
			mouseup: {fn: onMouseUp, target: document},
			resize: {fn: onResize, target: window}
		};

		if ( pane.parentNode ) {
			body.removeChild(pane);
			this.clear();
			eventListenerBulk(events, true);
			return this.visible = false;
		} else {
			body.appendChild(pane);
			eventListenerBulk(events, false);
			return this.visible = true;
		}
	};

	// Prevent scrolling the page when the scrolling inside the inspector pane
	// reaches the top and bottom limits
	pane.addEventListener('mousewheel', function(event) {
		if ((event.wheelDeltaY > 0 && pane.scrollTop === 0) ||
			(event.wheelDeltaY < 0 && (
				pane.scrollTop + pane.offsetHeight) === pane.scrollHeight
			)) {
			event.preventDefault();
		}
	});

	// Catch clicks at the top of the pane, and stop them, to prevent
	// triggering behavior in the app being inspected
	pane.addEventListener('click', function(event) {
		event.stopPropagation();
	});

	// States for the inspector pane resizing functionality
	var isResizing = false;
	var canResize = false;

	// Defines how many pixels to the left and right of the border of the pane
	// are considered within the resize handle
	var LEFT_RESIZE_HANDLE_PAD = 3;
	var RIGHT_RESIZE_HANDLE_PAD = 2;
	var MINIMUM_WIDTH = 50;
	var MAXIMUM_WIDTH = 100;

	// Listen for mousemove events in the page body, setting the canResize state
	// if the mouse hovers close to the 
	function onMouseMove(event) {

		// Don't do anything if the inspector is detached from the DOM
		if (!pane.parentNode) return;

		// Check if the mouse cursor is currently hovering the resize handle,
		// consisting of the vertical pixel column of the inspector border plus
		// a pad of pixel columns to the left and right. The class added to
		// the page body is used for styling the cursor to `col-resize`
		if (pane.offsetLeft - LEFT_RESIZE_HANDLE_PAD <= event.clientX &&
			event.clientX <= pane.offsetLeft + RIGHT_RESIZE_HANDLE_PAD) {
			canResize = true;
			body.classList.add('ngi-resize');
		} else {
			canResize = false;
			body.classList.remove('ngi-resize');
		}
		
		// If the user is currently performing a resize, the width is adjusted
		// based on the cursor position
		if (isResizing) {

			var width = (window.innerWidth - event.clientX);

			// Enforce minimum and maximum limits
			if (width >= window.innerWidth - MINIMUM_WIDTH) {
				width = window.innerWidth - MINIMUM_WIDTH;
			} else if (width <= MAXIMUM_WIDTH) {
				width = MAXIMUM_WIDTH;
			}

			pane.style.width = width + 'px';
		}
	}

	// Listen to mousedown events in the page body, triggering the resize mode
	// (isResizing) if the cursor is within the resize handle (canResize). The
	// class added to the page body styles it to disable text selection while the
	// user dragging the mouse to resize the pane
	function onMouseDown() {
		if (canResize) {
			isResizing = true;
			body.classList.add('ngi-resizing');
		}
	}
	

	// Listen to mouseup events on the page, turning off the resize mode if one
	// is underway. The inspector width is then persisted in the localStorage
	function onMouseUp() {
		if (isResizing) {
			isResizing = false;
			body.classList.remove('ngi-resizing');
			localStorage.setItem('ng-inspector-width', pane.offsetWidth);
		}
	}

	// If the user contracts the window, this makes sure the pane won't end up
	// wider thant the viewport
	function onResize() {
		if (pane.offsetWidth >= body.offsetWidth - MINIMUM_WIDTH) {
			pane.style.width = (body.offsetWidth - MINIMUM_WIDTH) + 'px';
		}
	}

	// Can perform a mapping of events/functions to addEventListener
	// or removeEventListener, to prevent code duplication when bulk adding/removing
	function eventListenerBulk(eventsObj, remove) {
		var eventListenerFunc = remove ? 'removeEventListener' : 'addEventListener';
		Object.keys(eventsObj).forEach(function(event) {
			eventsObj[event].target[eventListenerFunc](event, eventsObj[event].fn);
		});
	}

};