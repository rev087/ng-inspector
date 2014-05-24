$(function() {

	var releasesURL = "https://api.github.com/repos/rev087/ng-inspector/releases?callback=foo";
	$.ajax(releasesURL, {
		dataType: "jsonp",
		success: function(res) {
			console.log(res.data);
			var latest = res.data[0];
			$('.version').text(latest.name);
		}
	});

var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
if (isSafari) $('.screenshot.safari').css('display', 'initial');

// var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

else $('.screenshot.chrome').css('display', 'initial');




});
