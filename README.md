# ng-inspector

__ng-inspector__ is a Safari extension that displays an inspector panel to display the AngularJS scope hierarchy in the current page in real time.

Hovering over a scope in the inspector will highlight with a blue border the DOM element that scope is attached to, as well as any bindings with a red border. Clicking on a model will console.log that model's contents.

The extension adds a toolbar icon with the AngularJS logo that toggles the pane on and off.

![screenshot](screenshot.png?raw=true)

## Roadmap

In the long term, I'd like to offer at least a larger subset of the features available in the [AngularJS Batarang](https://github.com/angular/angularjs-batarang) extension, but this project is not intended as a direct port. As far as I'm aware, it is not possible to extend the Safari Web Inspector, making a direct port impossible right out of the door.

The current priority is adding a control to change the docking position of the inspector from the right to the left, as it often stands on top of elements on the page making it impossible to interact with those elements while the inspector is visible.