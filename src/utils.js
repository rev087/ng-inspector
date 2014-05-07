function mergeArray() {
	var merged = [];
	for (var a = 0; a < arguments.length; a++) {
		var arr = arguments[a];
		for (var i = 0; i < arr.length; i++) {
			if (merged.indexOf(arr[i]) < 0) merged.push(arr[i]);
		}
	}
	return merged;
};

function arrayInclude(arr, el) {
	if (arr.indexOf(el) < 0) arr.push(el);
}