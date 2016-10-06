angular.module('app')
.factory('googFactory', googFactory);

function googFactory() {
	var observerCallbacks = [];
	var state = {
		SignedIn: false,
		AuthChecked: false
	}

	// This is what gets returned to expose functions/properties
	var factory = {
		registerObserverCallback: function(callback) {
			observerCallbacks.push(callback);
		},
		notifyObservers: function() {
			angular.forEach(observerCallbacks, function(callback) {
				callback();
			});
		},
		state: state,
		SignIn: signIn,
		SignOut: signOut,
		CreateEvent: createEvent
	}

	var apiKey = "AIzaSyDewSHjEdXzI2QZL9kmlnkyXwW85XZdI3A";
	var clientId = "413327612065-omtvph565mocdmrs33iec0l6tqatojc8.apps.googleusercontent.com";
	var scopes = "https://www.googleapis.com/auth/calendar";


	function initAuth() {
		gapi.client.setApiKey(apiKey);
		gapi.auth2.init({
			client_id: clientId,
			scope: scopes,
		}).then(function () {
			// Listen for sign-in state changes.
			gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
			updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
		});
	}

	// Get authorization from the user to access profile info
	function signIn() {
		gapi.auth2.getAuthInstance().signIn().then(function() {
			loadApi();
		});
	}

	function signOut() {
		gapi.auth2.getAuthInstance().signOut().then(function() {
			factory.state.SignedIn = false;
			factory.notifyObservers();
		});
	}


	// Load the API
	function loadApi() {
		gapi.client.load('calendar', 'v3', function() {
			factory.state.SignedIn = true;
			factory.notifyObservers();
		});
	}

	// Create a calendar event
	function createEvent(event, callback) {

		var request = gapi.client.calendar.events.insert(event);

		request.execute(function(resp) {
			if (callback) {
				callback();
			}
			return resp;
		});
	}

	function updateSigninStatus(isSignedIn) {
		factory.state.AuthChecked = true;
		factory.notifyObservers();
		if (isSignedIn) {
			loadApi();
		}
	}

	// Start loading the auth stuff
	gapi.load('client:auth2', initAuth);

	return factory;

}
