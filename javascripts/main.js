$(function() {

	var releasesURL = "https://api.github.com/repos/rev087/ng-inspector/releases?callback=foo";
	$.ajax(releasesURL, {
		dataType: "jsonp",
		success: function(res) {
			console.log(res.data);
			var latest = res.data[0],
				downloadURL = latest.assets[0].url,
				version = latest.name,
				dlButton = $('<li><a href="ng-inspector.safariextz">Download <strong>'+version+'</strong></a></li>');
				// dlButton = $('<li><a href="'+downloadURL+'">Download <strong>'+version+'</strong></a></li>');
			$('.dl-list').prepend(dlButton);
		}
	});


});