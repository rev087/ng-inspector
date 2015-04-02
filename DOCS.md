# Documentation

ng-inspector is designed to be cross-browser, using vanilla JavaScript to inspect running AngularJS applications and render the scope tree panel. This document describes the flow of the inspection from the moment the user clicks the toolbar button.

When the inspection pane is triggered (the user clicks on the toolbar button): 

1. **NGI.Inspector.toggle()**: check for the presence of AngularJS in the page
2. **NGI.InspectorAgent.findApps()**: traverse the DOM looking for root nodes for AngularJS applications
3. **NGI.App.bootstrap()**: for each app found, instantiate an _App_ object which creates a [MutationObserver](https://developer.mozilla.org/en/docs/Web/API/MutationObserver). Also registers probes (functions that annotate the _TreeView_ items, such as a controller or directive name) for a few built-in directives (`ng-repeat`, `ng-include` etc)
4. **NGI.Module.register()**: if the app is not anonimous, this method is called recursively to register module dependencies.
5. **NGI.Service.parseQueue()**: for each module registered, the `_invokeQueue` is iterated over and a "probe" (see item 3) is registered for each directive and controller in the module
6. **NGI.InspectorAgent.inspectApp()** is called for each Angular app found in the initial traversal, and after a change is detected by the MutationObserver
	- **traverseScopes()** is called for the app root scope and traverses the scope tree down, instantiating `NGI.Scope` objects along the way
	- **traverseDOM()** is called for the app root DOM node and traverses the DOM subtree down, internally registering which DOM nodes are housing a scope found in the previous traversal and calling the "probe" functions to annotate controller and directive names in the TreeView
7. **NGI.Scope.instance()** called for each scope found, registers a watcher for the scope and triggers a scope traversal on changes