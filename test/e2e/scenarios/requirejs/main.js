require.config({
  noGlobal: true,
  paths: {
    'angular': 'lib/angular.min'
  },
  shim: {
    'angular': {
      exports: 'angular'
    }
  },
  deps: ['requirejs/bootstrap'] // depend on (and load) bootstrap.js
});
