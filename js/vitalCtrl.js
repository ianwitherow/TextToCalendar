angular.module('app')
.controller('vitalCtrl', ['googFactory', '$scope', '$timeout', vitalCtrl]);

function vitalCtrl(googFactory, $scope, $timeout) {
	var vm = this;
	vm.SignedIn = false;
	vm.UserName = '';
	vm.AuthChecked = false;
	vm.Events = [];
	vm.ScheduleText = "";
	vm.Month = moment().format('MM');
	vm.Year = moment().format('YYYY');
	vm.Finished = false;
	vm.EventTitle = localStorage.getItem("eventTitle") || "My Generic Event";

	vm.AddingEvents = false;
	vm.Progress = 0;

	var monthAndYearRegex = /(January|February|March|April|May|June|July|August|September|October|November|December)\s(\d{4})/gm;
	var timeRegex = /^(\d{1,2}:\d{2} [A|P|a|p][M|m])-(\d{1,2}:\d{2} [A|P|a|p][M|m])/m;

	// Populate months
	vm.Months = moment.months().map(function(name, index) {
		return { value: index + 1, name: name };
	});

	// Populate years
	vm.Years = [
		moment().format('YYYY'),
		moment().add(1, 'years').format('YYYY')
	];

	// Update scope variables when the factory values change
	var updateScope = function() {
		$scope.$apply(function() {
			vm.AuthChecked = googFactory.state.AuthChecked;
			vm.SignedIn = googFactory.state.SignedIn;
			vm.UserName = googFactory.state.UserName;
		});
	}

	// Expose some factory functions to the view
	vm.SignIn = googFactory.SignIn;
	vm.SignOut = googFactory.SignOut;

	// Create the array of events based on what was pasted into the textarea
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

	// Adds our list of events to the Google calendar
	vm.AddEventsToCalendar = function(e) {
		e.preventDefault();
		vm.Progress = 0.1;
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
				},
				'index': index
			}
			googFactory.CreateEvent(e, function() {
				finishedRequests++;
				// Update progress
				$scope.$apply(function() {
					vm.Progress = finishedRequests / totalRequests;
				});
				// Mark event as complete
				vm.Events[e.index].complete = true;
				if (finishedRequests >= totalRequests) {
					$scope.$apply(function() {
						vm.Finished = true;
						vm.AddingEvents = false;
						// Reset progress to 0 after a couple seconds
						$timeout(function() {
							vm.Progress = 0;
						}, 2000);
					});
				}
			});
		});
	}

	// Save the event title to localStorage so we can load it up next time
	vm.UpdateEventTitle = function() {
		localStorage.setItem("eventTitle", vm.EventTitle);
	}


	googFactory.registerObserverCallback(updateScope);

}
