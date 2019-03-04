// import {PushModule} from "nu-art--react-core"

importScripts('https://www.gstatic.com/firebasejs/5.5.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.5.0/firebase-messaging.js');

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

messaging.setBackgroundMessageHandler(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  // var notificationTitle = 'Background Message Title';
  // var notificationOptions = {
  //   body: 'Background Message body.',
  //   icon: '/firebase-logo.png'
  // };
  //
  // return self.registration.showNotification(notificationTitle,
  //   notificationOptions);
});
