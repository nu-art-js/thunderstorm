/**
 * Created by tacb0ss on 05/10/2018.
 */

var config = {
	apiKey: "AIzaSyBfP9N5P5uJ8uq3hU34aAaWOkVSNA6UFQg",
	authDomain: "test-fcm-fdcdc.firebaseapp.com",
	databaseURL: "https://test-fcm-fdcdc.firebaseio.com",
	projectId: "test-fcm-fdcdc",
	storageBucket: "test-fcm-fdcdc.appspot.com",
	messagingSenderId: "185978809529"
};
firebase.initializeApp(config);

const messaging = firebase.messaging();
messaging.usePublicVapidKey('BGc8xKM1ujTCwBu6_PnvPQwANhpTo3fGWVasQ_HzP4hIyt96hE2-qpnuE2JQoo4Jx2V9Sc1jKeGDetheAx93uBE');

let getToken = function () {
	messaging.getToken().then(function (refreshedToken) {
		if (!refreshedToken)
			return requestPermission();

		console.log('Token refreshed: ' + refreshedToken);
//        setTokenSentToServer(false);
//        sendTokenToServer(refreshedToken);
	}).catch(function (err) {
		console.error(err);
	});
};

messaging.onTokenRefresh(function () {
	getToken();
});
getToken();

// Handle incoming messages. Called when:
// - a message is received while the a`pp has focus
// - the user clicks on an app notification created by a service worker
//   `messaging.setBackgroundMessageHandler` handler.
messaging.onMessage(function (payload) {
	console.log('Message received. ', payload);
});

function requestPermission() {
	console.log('Requesting permission...');
	messaging.requestPermission().then(function () {
		console.log('Notification permission granted.');
		getToken();
	}).catch(function (err) {
		console.log('Unable to get permission to notify.', err);
	});
	// [END request_permission]
}
