$(function() {

	$('#chrome-dl-btn').click(function(e) {
		ga('send', 'event', 'button', 'click', 'chrome-download');
	});

	$('#safari-dl-btn').click(function(e) {
		ga('send', 'event', 'button', 'click', 'safari-download');
	});

	$('#github-repo-btn').click(function(e) {
		ga('send', 'event', 'button', 'click', 'github-repo');
	});

	var releasesURL = "https://api.github.com/repos/rev087/ng-inspector/releases?callback=foo";
	$.ajax(releasesURL, {
		dataType: "jsonp",
		success: function(res) {
			var latest = res.data[0];
			$('.version').text(latest.name);
		}
	});

	// var isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
	var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
	var isFirefox = /Mozilla/.test(navigator.userAgent) && /Firefox/.test(navigator.userAgent);

	if (isSafari)
		$('.screenshot.safari').css('display', 'initial');
	else if (isFirefox)
		$('.screenshot.firefox').css('display', 'initial');
	else
		$('.screenshot.chrome').css('display', 'initial');
});
