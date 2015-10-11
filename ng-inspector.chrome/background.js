chrome.pageAction.onClicked.addListener(function(tab) {
	var message = {
		command: 'ngi-toggle'
	};
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message);
	});
});

chrome.runtime.onMessage.addListener(function(msg, sender) {
    if ((msg.from === 'content') && (msg.command === 'install-ngi-toggle')) {
        chrome.pageAction.show(sender.tab.id);
    }
});
