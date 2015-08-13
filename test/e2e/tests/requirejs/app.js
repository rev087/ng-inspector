define([
  // This RequireJS module depends on the 'angular'
  // RequireJS module already defined in main.js, and the
  // 'controllers' RequireJS module defined in controllers.js
  'angular',
  'controllers'
], function (angular) {
  'use strict';
  // Define the emtpy Angular app
  return angular.module('DemoApp', [
    // Angular module dependencies
    'app.controllers'
  ]);
});
