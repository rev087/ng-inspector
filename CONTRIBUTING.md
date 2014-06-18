# Contributing

## Installing development dependencies

Run `npm install` (npm comes bundled with [node.js](http://nodejs.org)) to install all the development dependencies to build and test the project.

## Building the extension

JavaScript source is located at `/src`, and uses [gulp](http://gulpjs.com) to build for Chrome at `/ng-inspector.chrome` and Safari at `/ng-inspector.safariextension`.

### Gulp Tasks:
- `default`: runs all the build tasks
- `build:icons`: copies the icons over to each browser folders
- `build:css`: compiles the less files over to each browser folders
- `build:js`: concatenates the source JavaScript over to each browser folder
- `bump:major`, `bump:minor`, `bump:patch`: bumps the version in `package.json`, `Info.plist` (Safari) and `manifest.json` (Chrome), adds these files to Git staging, commits with a "Prepare for vX.Y.Z" message and tag the commit with the version number

## Testing

ng-inspector uses [Protractor](https://github.com/angular/protractor) for end to end tests in Chrome. First, start the scenarios server with `npm scenarios` and run `npm test` to run the tests.

Scenarios are small angular applications written to test various AngularJS use cases, and are located at `/test/e2e/scenarios/`. Each scenario should have one spec file containing the tests themselves, and they are located at `/test/e2e/specs/`.