/* global NGI */
/* jshint strict: false */
/* jshint shadow: true */

NGI.Utils = (function() {

	var Utils = {};

	var SPECIAL_CHARS_REGEXP = /([\:\-\_]+(.))/g;
	var MOZ_HACK_REGEXP = /^moz([A-Z])/;

	/**
	 * Converts snake_case to camelCase.
	 * Also a special case for Moz prefix starting with upper case letter.
	 */
	Utils.camelCase = function(name) {
		return name.
			replace(SPECIAL_CHARS_REGEXP, function(_, separator, letter, offset) {
				return offset ? letter.toUpperCase() : letter;
			}).
			replace(MOZ_HACK_REGEXP, 'Moz$1');
	}

	var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
	var FN_ARG_SPLIT = /,/;
	var FN_ARG = /^\s*(_?)(\S+?)\1\s*$/;
	var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

	var PREFIX_REGEXP = /^(x[\:\-_]|data[\:\-_])/i;
	/**
	 * Converts all accepted directives format into proper directive name.
	 * All of these will become 'myDirective':
	 *   my:Directive
	 *   my-directive
	 *   x-my-directive
	 *   data-my:directive
	 */
	Utils.directiveNormalize = function(name) {
		return NGI.Utils.camelCase(name.replace(PREFIX_REGEXP, ''));
	}

	/**
	 * Receives a service factory and returns an injection token. Only used in
	 * older versions of AngularJS that did not expose `.annotate`
	 * 
	 * Adapted from https://github.com/angular/angular.js/blob/0baa17a3b7ad2b242df2b277b81cebdf75b04287/src/auto/injector.js
	 **/
	Utils.annotate = function(fn) {
		var $inject, fnText, argDecl;

		if (typeof fn === 'function') {
			if (!($inject = fn.$inject)) {
				$inject = [];
				if (fn.length) {
					fnText = fn.toString().replace(STRIP_COMMENTS, '');
					argDecl = fnText.match(FN_ARGS);
					var argDecls = argDecl[1].split(FN_ARG_SPLIT);
					for (var i = 0; i < argDecls.length; i++) {
						var arg = argDecls[i];
						arg.replace(FN_ARG, function(all, underscore, name) {
							$inject.push(name);
						});
					};
				}
				fn.$inject = $inject;
			}
		} else if (Array.isArray(fn)) {
			$inject = fn.slice(0, fn.length - 1);
		} else {
			return false;
		}

		return $inject;
	}

	return Utils;

})();