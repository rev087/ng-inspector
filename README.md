# ng-inspector

__ng-inspector__ is a Safari extension that displays an inspector panel showing the AngularJS scope hierarchy in the current page in real time, as well as which controllers or directives are associated with which scope.

Hovering over a scope in the inspector will highlight with a blue border the DOM element that scope is attached to, as well as any bindings with a red border. Clicking on a model will console.log that model's contents.

The extension adds a toolbar icon with the AngularJS logo that toggles the pane on and off.

![screenshot](screenshot.png?raw=true)

## Roadmap

In the long term, I'd like to offer at least a larger subset of the features available in the [AngularJS Batarang](https://github.com/angular/angularjs-batarang) extension, but this project is not intended as a direct port. As far as I'm aware, it is not possible to extend the Safari Web Inspector, making a direct port impossible right out of the door.

## Credits

Thanks for caitp, wafflejock and zomg at #angularjs for helping me figure out a lot of
AngularJS edge cases.

## License

The MIT License (MIT)  

See LICENSE.md for details.