# TODO

Instead of using $scope.$watch(function() {...}) to watch for changes in scopes,
we can use MutationObserver to watch for changes in the DOM, and run the Inspector Agent on that subtree.