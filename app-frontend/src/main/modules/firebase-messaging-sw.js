// /*
//  * A typescript & react boilerplate with api call example
//  *
//  * Copyright (C) 2018  Adam van der Kruk aka TacB0sS
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
//
// // Give the service worker access to Firebase Messaging.
// // Note that you can only use Firebase Messaging here, other Firebase libraries
// // are not available in the service worker.
// // const firebase = require('firebase/app');
// // tslint:disable-next-line:no-import-side-effect
// // require('firebase/messaging');
// importScripts('https://www.gstatic.com/firebasejs/7.13.1/firebase-app.js');
// importScripts('https://www.gstatic.com/firebasejs/7.13.1/firebase-messaging.js');
//
// firebase.initializeApp({
// 	apiKey: "AIzaSyCoQjoQibuydMi1ejlpobfgHOI7WMf11P8",
// 	authDomain: "nu-art-thunderstorm.firebaseapp.com",
// 	projectId: "nu-art-thunderstorm",
// 	messagingSenderId: "992823653177",
// 	appId: "1:992823653177:web:e289e37f159c1b56de6ee8"
// });
//
// const messaging = firebase.messaging();
//
// messaging.setBackgroundMessageHandler(function (payload) {
// 	console.log('[firebase-messaging-sw.js] Received background message ', payload);
// 	Customize notification here
// 	const notificationTitle = 'IR Q Support';
// 	const notificationOptions = {
// 		body: payload.data.content,
// 		icon: '/favicon.ico',
// 		image: '/icon_firebase.png',
// 		requireInteraction: true,
// 		actions: [{
// 			action: payload.data && payload.data.content ? payload.data.content : '/',
// 			title: 'Open ir-q-support!',
// 			icon: '/favicon.ico'
// 		}]
// 	};
//
// 	self.onnotificationclick = function (event) {
// 		console.log('On notification click: ', event, event.notification);
// 		event.notification.close();
//
// 		// This looks to see if the current is already open and
// 		// focuses if it is
// 		event.waitUntil(clients.matchAll({
// 			type: "window"
// 		}).then(function (clientList) {
// 			console.log(clientList);
// 			for (let i = 0; i < clientList.length; i++) {
// 				const client = clientList[i];
// 				console.log(client);
// 				if (client.url == '/' && 'focus' in client)
// 					return client.focus();
// 			}
// 			if (clients.openWindow)
// 				return clients.openWindow(event.notification.actions[0].action);
// 		}));
// 	};
//
// 	return self.registration.showNotification('I got', 'this');
// });
