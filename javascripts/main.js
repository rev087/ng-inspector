$(function() {

	var releasesURL = "https://api.github.com/repos/rev087/ng-inspector/releases?callback=foo";
	$.ajax(releasesURL, {
		dataType: "jsonp",
		success: function(res) {
			console.log(res.data);
			var latest = res.data[0],
				downloadURL = latest.assets[0].url,
				version = latest.name,
				safariButton = $('<li><a href="ng-inspector.safariextz">'+version+'<strong>for Safari</strong></a></li>'),
				chromeButton = $('<li><a href="https://chrome.google.com/webstore/detail/ng-inspector/aadgmnobpdmgmigaicncghmmoeflnamj">'+version+'<strong>for Chrome</strong></a></li>');
			$('.dl-list').prepend(safariButton);
			$('.dl-list').prepend(chromeButton);
		}
	});


});