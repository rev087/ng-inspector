require.config({
  noGlobal: true,
  baseUrl: '/tests/requirejs',
  paths: {
    'angular': window.angularLibPath
  },
  shim: {
    'angular': {
      exports: 'angular'
    }
  },
  deps: ['bootstrap'] // depend on (and load) bootstrap.js
});
