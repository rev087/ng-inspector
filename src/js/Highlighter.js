/* global NGI */
/* jshint strict: false */
/* jshint expr: true */
/* jshint boss: true */

NGI.Highlighter = (function() {

	function Highlighter() {}

	function offsets(node) {
		var vals = {
			x: node.offsetLeft,
			y: node.offsetTop,
			w: node.offsetWidth,
			h: node.offsetHeight
		};
		while (node = node.offsetParent) {
			vals.x += node.offsetLeft;
			vals.y += node.offsetTop;
		}
		return vals;
	}

	var hls = [];
	Highlighter.hl = function(node, label) {
		var box = document.createElement('div');
		box.className = 'ngi-hl ngi-hl-scope';
		if (label) {
			box.innerText = label;
		}
		var pos = offsets(node);
		box.style.left = pos.x + 'px';
		box.style.top = pos.y + 'px';
		box.style.width = pos.w + 'px';
		box.style.height = pos.h + 'px';
		document.body.appendChild(box);
		hls.push(box);
		return box;
	};

	Highlighter.clear = function() {
		var box;
		while (box = hls.pop()) {
			box.parentNode.removeChild(box);
		}
	};

	return Highlighter;

})();