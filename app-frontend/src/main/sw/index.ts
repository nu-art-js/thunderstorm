/*
 * A typescript & react boilerplate with api call example
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const config = require('../main/config').config;
const firebaseVersion = config?.ServiceWorker?.firebaseVersion;
if(firebaseVersion)
	importScripts(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`,
	              `https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-messaging.js`);

enum LogLevel {
	INFO,
	ERROR
}

function myLog(level: LogLevel, ...text: any[]) {
	const color = level === LogLevel.INFO ? 'orange' : 'red';
	for(const t of text){
		if(typeof t === "object")
			console.log(t)
		else
			console.log('%c ' + text, `color: ${color};`);
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

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
// @ts-ignore
if (typeof firebase === 'undefined') {
	console.warn('You forgot to import firebase?');
} else {

	// @ts-ignore
	const session = firebase.initializeApp(config.FirebaseModule.local);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
	const messaging = session.messaging();
// @ts-ignore
	messaging.onBackgroundMessage((payload) => {
		myLogInfo('[ts_service_worker.js] Received background message ', payload);
		const message = {
			command: 'SwToApp',
			message: payload.data
		};

		// @ts-ignore
		self.clients.matchAll({type: "window", includeUncontrolled: true}).then(clients => {
			// @ts-ignore
			clients.forEach(function (client) {
				client.postMessage(message);
			});
		});
	});
}

export default null;