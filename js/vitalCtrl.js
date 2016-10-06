angular.module('app')
.controller('vitalCtrl', ['googFactory', '$timeout', vitalCtrl]);

function vitalCtrl(googFactory, $timeout) {
	var vm = this;
	vm.SignedIn = false;
	vm.AuthChecked = false;
	vm.Events = [];
	vm.ScheduleText = "";
	vm.Month = moment().format('MM');
	vm.Year = moment().format('YYYY');
	vm.Finished = false;
	vm.EventTitle = localStorage.getItem("eventTitle") || "Work at Vital Outdoors";
		
	vm.AddingEvents = false;

	var monthAndYearRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s(\d{4})/gm;
	var timeRegex = /^(\d{1,2}:\d{2} [A|P|a|p][M|m])-(\d{1,2}:\d{2} [A|P|a|p][M|m])/m;

	vm.Months = [];
	// Populate months
	 (function() {
		var d = moment().startOf('year');
		var months = [];
		for (var i = 0; i < 12; i++) {
			var monthValue = d.format('MM')
			vm.Months.push({ value: d.format('MM'), name: d.format('MMMM') })
			d.add(1, 'months');
		}
	})();

	vm.Years = [];
	// Populate years
	(function() {
		// Just return the current year and the next
		var now = moment();
		vm.Years = [
			now.format('YYYY'),
			now.add(1, 'years').format('YYYY')
		]
	})();

	var updateScope = function() {
		$timeout(function() {
			vm.AuthChecked = googFactory.state.AuthChecked;
			vm.SignedIn = googFactory.state.SignedIn;
		});
	}

	vm.SignIn = googFactory.SignIn;
	vm.SignOut = googFactory.SignOut;
	vm.CreateEvent = googFactory.CreateEvent;

	vm.UpdateEventsList = function() {
		vm.Events = [];
		// Parse the ScheduleText to get the days and times
		// See if the month and year were in the pasted text; if so, set the dropdowns to those values
		var monthYearMatches = monthAndYearRegex.exec(vm.ScheduleText);
		if (monthYearMatches != null && monthYearMatches.length > 1) {
			vm.Month = (moment.months().indexOf(monthYearMatches[1].trim()) + 1).toString()
			vm.Year = monthYearMatches[2].trim();
		}

		// Loop through each line of text
		var lines = vm.ScheduleText.split('\n');
		for (var i = 0; i < lines.length; i++) {
			if (timeRegex.test(lines[i])) {
				// This line has the time. Go back two lines for the date number
				// The line right above is their name, the line above that is the date number
				var matches = timeRegex.exec(lines[i]);
				var start = matches[1];
				var end = matches[2];
				if (i - 2 >= 0) {
					// Two lines up is still actually a line
					var dayNumber = lines[i - 2];
					if (dayNumber.length > 0 && dayNumber.length <= 2 && !isNaN(dayNumber) && +dayNumber <= 31) {
						// Day should be valid; one or two digits long and less than 32
						var event = {
							date: vm.Month + '/' + dayNumber + '/' + vm.Year,
							start: start,
							end: end
						}
						vm.Events.push(event);
					}
				}
			}
		}
	}

	vm.AddEventsToCalendar = function() {
		if (vm.AddingEvents) {
			return;
		}
		// Make sure required fields are good
		// TODO: validate start and end dates on events
		// TODO: show error message if any api calls fail
		if (vm.EventTitle.length === 0 || vm.Month === 0 || vm.Month.length === 0 || vm.Year.length === 0) {
			vm.Error = "Something's wrong - make sure the month and year are selected, and that there's an Event Title.";
			return;
		}
		vm.AddingEvents = true;
		var totalRequests = vm.Events.length;
		var finishedRequests = 0;
		vm.Events.forEach(function(event, index) {
			var startDate = moment(event.date + ' ' + event.start, 'MM/D/YYYY HH:mm a');
			var endDate = moment(event.date + ' ' + event.end, 'MM/D/YYYY HH:mm a');

			var e = {
				'calendarId': 'primary',
				'summary': vm.EventTitle,
				'location': '1224 Washington Ave # 125, Golden, CO 80401',
				'description': '',
				'start': {
					'dateTime': startDate.format(),
					'timeZone': 'America/Denver'
				},
				'end': {
					'dateTime': endDate.format(),
					'timeZone': 'America/Denver'
				}
			}
			googFactory.CreateEvent(e, function() {
				finishedRequests++;
				if (finishedRequests >= totalRequests) {
					$timeout(function() {
						vm.Finished = true;
						vm.AddingEvents = false;
					});
				}
			});
		});
	}

	vm.UpdateEventTitle = function() {
		localStorage.setItem("eventTitle", vm.EventTitle);
	}

	vm.CreateTestEvent = function() {
		var event = {
			'calendarId': 'primary',
			'summary': 'Hangin with Dave',
			'location': '1224 Washington Ave # 125, Golden, CO 80401',
			'description': '',
			'start': {
				'dateTime': '2016-10-06T09:00:00',
				'timeZone': 'America/Denver'

			},
			'end': {
				'dateTime': '2016-10-06T17:00:00',
				'timeZone': 'America/Denver'

			}
		}
		googFactory.CreateEvent(event);
	}

	googFactory.registerObserverCallback(updateScope);

}
