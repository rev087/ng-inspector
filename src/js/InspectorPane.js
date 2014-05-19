/* global NGI */
/* jshint strict: false */

/**
 * `NGI.InspectorPane` is responsible for the root element and basic interaction
 * with the pane (in practice, a <div>) injected in the page DOM, such as
 * toggling the pane on and off, handle mouse scrolling, resizing and first
 * level of child views.
 */

NGI.InspectorPane = function() {

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

	// Toggle the inspector pane on and off. Returns a boolean representing the
	// new visibility state.
	this.toggle = function() {
		if ( pane.parentNode ) {
			document.body.removeChild(pane);
			this.clear();
			document.removeEventListener('mousemove', onMouseMove);
			document.removeEventListener('mousedown', onMouseDown);
			document.removeEventListener('mouseup', onMouseUp);
			window.removeEventListener('resize', onResize);
			return false;
		} else {
			document.body.appendChild(pane);
			document.addEventListener('mousemove', onMouseMove);
			document.addEventListener('mousedown', onMouseDown);
			document.addEventListener('mouseup', onMouseUp);
			window.addEventListener('resize', onResize);
			return true;
		}
	};

	var inspectorPane = this;

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

	// The width of the pane can be resized by the user, and is persisted via
	// localStorage
	var inspectorWidth = localStorage.getItem('ng-inspector-width') || 300;

	// States for the inspector pane resizing functionality
	this.isResizing = false;
	this.canResize = false;

	// Defines how many pixels to the left and right of the border of the pane
	// are considered within the resize handle
	var LEFT_RESIZE_HANDLE_PAD = 3;
	var RIGHT_RESIZE_HANDLE_PAD = 2;

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
			inspectorPane.canResize = true;
			document.body.classList.add('ngi-resize');
		} else {
			inspectorPane.canResize = false;
			document.body.classList.remove('ngi-resize');
		}
		
		// If the user is currently performing a resize, the width is adjusted
		// based on the cursor position
		if (inspectorPane.isResizing) {

			var width = (document.width - event.clientX);

			// Enforce minimum and maximum limits
			if (width >= document.body.offsetWidth - 50) {
				width = document.body.offsetWidth - 50;
			} else if (width <= 100) {
				width = 100;
			}

			pane.style.width = width + 'px';
		}
	}

	// Listen to mousedown events in the page body, triggering the resize mode
	// (isResizing) if the cursor is within the resize handle (canResize). The
	// class added to the page body styles it to disable text selection while the
	// user dragging the mouse to resize the pane
	function onMouseDown() {
		if (inspectorPane.canResize) {
			inspectorPane.isResizing = true;
			document.body.classList.add('ngi-resizing');
		}
	}
	

	// Listen to mouseup events on the page, turning off the resize mode if one
	// is underway. The inspector width is then persisted in the localStorage
	function onMouseUp() {
		if (inspectorPane.isResizing) {
			inspectorPane.isResizing = false;
			document.body.classList.remove('ngi-resizing');
			localStorage.setItem('ng-inspector-width', pane.offsetWidth);
		}
	}

	// If the user contracts the window, this makes sure the pane won't end up
	// wider thant the viewport
	function onResize() {
		if (pane.offsetWidth >= document.body.offsetWidth - 50) {
			pane.style.width = (document.body.offsetWidth - 50) + 'px';
		}
	}

};