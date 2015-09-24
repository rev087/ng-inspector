![logo](logo.png?raw=true)

![Travis CI Status](https://travis-ci.org/rev087/ng-inspector.svg?branch=master)

__ng-inspector__ is a browser extension for Chrome and Safari that displays an inspector panel showing the AngularJS scope hierarchy in the current page in real time, as well as which controllers or directives are associated with which scope.

Hovering over a scope in the inspector will highlight the DOM element that scope is attached to. Clicking on a model will console.log that model's contents.

The extension adds a button next to the address bar with the AngularJS logo that toggles the pane on and off.

![screenshot](screenshot.png?raw=true)

## Installing

### Chrome

Install it from the [Chrome Web Store](https://chrome.google.com/webstore/detail/ng-inspector/aadgmnobpdmgmigaicncghmmoeflnamj)

### Safari

Download the latest build from [ng-inspector.org](http://ng-inspector.org), then double click the `ng-inspector.safariextz` file to install.

## Lifehack

Show in panel controller names instead of $id

```javascript
    app
    .config(['$provide', function ($provide) {
      $provide.decorator('$controller', ['$delegate', function ($delegate) {
          return function(constructor, locals) {
            if (typeof constructor == "string") {
              locals.$scope.$id = constructor;
            }
            return $delegate(constructor, locals);
          }
        }]);
    }])
```

## License

The MIT License (MIT)  

See [LICENSE.md](LICENSE.md) for details.
