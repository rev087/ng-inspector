require.config({
  noGlobal: true,
  baseUrl: '/',
  paths: {
    'angular': window.angularLibPath
  },
  shim: {
    'angular': {
      exports: 'angular'
    }
  },
  deps: ['requirejs/bootstrap'] // depend on (and load) bootstrap.js
});
