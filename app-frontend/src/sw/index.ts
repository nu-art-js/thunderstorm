importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

var config = require('../main/config').config;
enum LogLevel {
	INFO,
	ERROR
}

console.warn('SW started');
function myLog(level: LogLevel, ...text: any[]) {
	var color = level === LogLevel.INFO ? 'orange' : 'red';
	for(var t of text){
		if(typeof t === "object")
			console.log(t)
		else
			console.log('%c ' + t, `color: ${color};`);
	}
}

function myLogError(...text: any[]) {
	myLog(LogLevel.ERROR, ...text);
}

function myLogInfo(...text: any[]) {
	myLog(LogLevel.INFO, ...text);
}

self.addEventListener("notificationclick", () => myLogInfo('Notification Clicked in SW'));
self.addEventListener("pushsubscriptionchange", () => myLogInfo('pushsubscriptionchange in SW'));
self.addEventListener("push", (e) => {
	myLogInfo('push in SW',e);
});

// Substitute previous service workers with the new one
self.addEventListener('activate', () => {
	myLogInfo('Activated SW');
	// @ts-ignore
	self.clients
		.claim()
		.then(() => myLogInfo('Service Worker activated'))
		// @ts-ignore
		.catch(e => myLogError('Error activating service worker', e));
});

self.addEventListener('install', () => {
	myLogInfo('Installed SW');
	// @ts-ignore
	self.skipWaiting()
		.then(() => myLogInfo('Skipped waiting, now using the new SW'))
		// @ts-ignore
		.catch(e => myLogError('Something wrong while skipping waiting. Service worker not queued', e));

});

// @ts-ignore
const isSupported = firebase?.messaging?.isSupported();
if (!isSupported)
	myLogError('Firebase not supported!')
else
	myLogInfo('Firebase is supported in SW!')

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
// @ts-ignore
if (typeof firebase === 'undefined') {
	console.warn('You forgot to import firebase?');
} else {
	// @ts-ignore
	const firebaseApp = firebase.initializeApp(config.FirebaseModule.local);
	const messaging = firebaseApp.messaging();

	// Retrieve an instance of Firebase Messaging so that it can handle background
	// messages.
	messaging.onBackgroundMessage({
			next: async (payload: any) => {
				myLogInfo('[ts_service_worker.js] Received background message ', payload);
				// @ts-ignore
				self.clients.matchAll({type: "window", includeUncontrolled: true}).then(clients => {
					// @ts-ignore
					clients.forEach(function (client) {
						client.postMessage(
							{
								command: 'SwToApp',
								message: payload.data
							});
					})
				})
			},
			error: myLogError,
			complete: myLogInfo
		}
	);
}
