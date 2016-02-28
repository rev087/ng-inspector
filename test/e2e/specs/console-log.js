function loggedAs(value){
	browser.manage().logs().get('browser').then(function(browserLog) {
		//grab only `console.info` output
		var infoLogs = browserLog.filter(function(msg) {
			return JSON.parse(msg.message).message.level === 'info';
		});

		expect(infoLogs.length).toEqual(1);

		expect(JSON.parse(infoLogs[0].message).message.text).toEqual(value);
	});
}


describe('console output after click on tree node', function() {

	var angularVersion = browser.params.angularVersion;

	beforeEach(function() {
		browser.get('console-log/' + angularVersion);
		element(by.id('ngInspectorToggle')).click();
	});


	it('should log true on checked', function() {
		//assumed, that checkbox is checked by default
		expect(element(by.model('isSelected')).isSelected()).toBeTruthy();
		element(by.css('.ngi-model-boolean > label')).click();

		loggedAs('true');
	});

	it('should log false after uncheck checkbox', function() {
		element(by.model('isSelected')).click();
		expect(element(by.model('isSelected')).isSelected()).toBeFalsy();
		element(by.css('.ngi-model-boolean > label')).click();

		loggedAs('false');
	});

	it('should log true after check checkbox', function() {
		element(by.model('isSelected')).click();
		element(by.model('isSelected')).click();
		expect(element(by.model('isSelected')).isSelected()).toBeTruthy();
		element(by.css('.ngi-model-boolean > label')).click();

		loggedAs('true');
	});

});