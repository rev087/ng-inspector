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

## Testing

ng-inspector uses [Protractor](https://github.com/angular/protractor) for end to end tests in Chrome. 

### Running Tests

1. Run `gulp` to ensure you have a fresh copy of the extension built from source
2. Run `gulp test` to run the test suite


*Scenarios are small angular applications written to test various AngularJS use cases, and are located at `/test/e2e/scenarios/`. Each scenario should have one spec file containing the tests themselves, and they are located at `/test/e2e/specs/`.