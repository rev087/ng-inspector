// Bootstrap angular onto the window.document node.
// Must do this rather than defining the ng-app directive
// so that RequireJS is able to first load dependencies.
define([
  'require',
  'angular',
  'requirejs/app'
], function (require, angular) {
  'use strict';
  angular.element(document).ready(function() {
    angular.bootstrap(document.querySelector('.angular-root-element'), ['DemoApp']);
  });
});
