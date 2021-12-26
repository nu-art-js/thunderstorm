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
import { initializeApp,FirebaseOptions } from "firebase/app";
import { getMessaging,onBackgroundMessage } from "firebase/messaging/sw";
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

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
// @ts-ignore
if (typeof firebase === 'undefined') {
	console.warn('You forgot to import firebase?');
} else {
	const firebaseApp = initializeApp(config.FirebaseModule.local as FirebaseOptions);
	const messaging = getMessaging(firebaseApp);

	// Retrieve an instance of Firebase Messaging so that it can handle background
	// messages.
	onBackgroundMessage(
		messaging, {
			next: async (payload) => {
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

export default null;