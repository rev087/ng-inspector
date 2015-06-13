function getUserDefinedKeys(values) {
	return Object.keys(values).filter(function(key) {
		return !isPrivateAngularProp(key);
	});
}

function isPrivateAngularProp(propName) {
	var PRIVATE_KEY_BLACKLIST = ['$parent', '$root', '$id'];
	var ANGULAR_PRIVATE_PREFIX = '$$';
	var firstTwoChars = propName[0] + propName[1];

	if (firstTwoChars === ANGULAR_PRIVATE_PREFIX) return true;
	if (PRIVATE_KEY_BLACKLIST.indexOf(propName) > -1 || propName === 'this') return true;
	return false;
}

function arrayDiff(a, b) {
	var i, ret = { added: [], removed: [], existing: [] };

	// Iterate through b checking for added and existing elements
	for (i = 0; i < b.length; i++) {
		if (a.indexOf(b[i]) < 0) {
			ret.added.push(b[i]);
		} else {
			ret.existing.push(b[i]);
		}
	}

	// Iterate through a checking for removed elements
	for (i = 0; i < a.length; i++) {
		if (b.indexOf(a[i]) < 0) {
			ret.removed.push(a[i]);
		}
	}

	return ret;
}

function ModelMixin() {}

ModelMixin.update = function(values, depth, Model) {

	if (typeof this.modelObjs === 'undefined') this.modelObjs = {};
	if (typeof this.modelKeys === 'undefined') this.modelKeys = [];

	var newKeys = getUserDefinedKeys(values),
			diff = arrayDiff(this.modelKeys, newKeys),
			i, key;

	// Removed keys
	for (i = 0; i < diff.removed.length; i++) {
		var key = diff.removed[i];
		this.modelObjs[key].view.destroy();
		delete this.modelObjs[key];
	}
	
	// New keys
	for (i = 0; i < diff.added.length; i++) {
		key = diff.added[i];
		this.modelObjs[key] = Model.instance(key, values[key], depth.concat([values]));
		var insertAtTop = this.ngiType === 'Scope';
		this.view.addChild(this.modelObjs[key].view, insertAtTop);
	}

	// Updated keys
	for (i = 0; i < diff.existing.length; i++) {
		key = diff.existing[i];
		if (!this.modelObjs[key]) {
			var inst = this.ngiType === 'Scope' ? 'Scope' : this.ngiType === 'Model' ? 'Model' : 'UNKNOWN INSTANCE';
			continue;
		}
		this.modelObjs[key].setValue(values[key]);
	}

	this.modelKeys = newKeys;
};

ModelMixin.extend = function(obj) {
	obj.update = ModelMixin.update.bind(obj);
};

module.exports = ModelMixin;
