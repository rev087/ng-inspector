# Contributing

More tests are always welcome. Pull requests containing new features _must_ include tests for these features.

## Installing development dependencies

Run `npm install` (npm comes bundled with [node.js](http://nodejs.org)) to install all the development dependencies to build and test the project.

## Building the extension

JavaScript source is located at `/src`, and uses [gulp](http://gulpjs.com) to build for Chrome at `/ng-inspector.chrome`, Safari at `/ng-inspector.safariextension` and Firefox at `/ng-inspector.firefox`.

### Gulp Tasks:

- `default`: runs all the build tasks
- `build:icons`: copies the icons over to each browser folders
- `build:css`: compiles the less files over to each browser folders
- `build:js`: concatenates the source JavaScript over to each browser folder
- `bump:major`, `bump:minor`, `bump:patch`: bumps the version in the manifest files, stages the changes in git, commits with a "Prepare for vX.Y.Z" message and tag the commit with the version number. Manifest files updated:
	- `package.json`
	- `ng-inspector.safariextension/Info.plist` (Safari)
	- `ng-inspector.chrome/manifest.json` (Chrome)
	- `ng-inspector.firefox/package.json` (Firefox)

## Packaging the extension

Each of the supported browsers require a different packaging process. Begin by building the extension with the default `gulp` task, then follow the browser-specific instructions below.

### Safari

Make sure _Show Develop menu in menu bar_ is selected in _Preferences…_ > _Advanced_ tab. Navigate to _Develop_ > _Show Extension Builder_, click the `+` button and select the `ng-inspector.safariextension` directory to add the extension to Safari in development mode. Finally, click _Build Package…_.

### Chrome

Compress the `ng-inspector.chrome` directory in a _.zip_ file and upload to the _Chrome Web Store_.

### Firefox

For 30 <= Firefox < 38, use _CFX_:

- Install addon-sdk 1.17 from https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/jetpack-sdk-latest.zip
(Reference: https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation)
- Activate cfx (e.g. source bin/activate)
- In the terminal, navigate to the `ng-inspector.firefox` directory.
	- To try the extension: `cfx run -b /path/to/firefox-30.0/firefox`
	- To build the _xpi_: `cfx xpi`

For Firefox >= 38, use _JPM_:

- Make sure to have installed the npm dependencies via `npm install`
- To try: `npm run run-xpi -- -b /path/to/firefox-38/firefox`
- To build the _xpi_: `npm run build-xpi`

## Testing

ng-inspector uses [Protractor](https://github.com/angular/protractor) to run e2e tests in Chrome and Firefox. Tests are run against several releases of Angular.

### Running Tests

There are two different options for running tests locally:

* `npm test` - Will open as many browsers as possible when running tests
* `npm run test-throttled` - Will limit tests to one browser at a time


### Angular Versions

Tests are executed against multiple versions of Angular, and can be configured in `test/e2e/angular-versions.conf.js`.