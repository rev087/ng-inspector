define([
  // This RequireJS module depends on the 'angular'
  // RequireJS module already defined in main.js
  'angular'
], function (angular) {
  // This RequireJS module depends on the 'angular'
  // RequireJS module defined in main.js
  'use strict';
  return angular.module('app.controllers', [])
    .controller('DemoCtrl', ['$scope', function ($scope) {
      $scope.foo = 'value initially set by DemoCtrl';
    }]);
});
