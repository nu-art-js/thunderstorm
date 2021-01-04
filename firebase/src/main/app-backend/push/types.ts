/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
 *
 * Copyright (C) 2020 Intuition Robotics
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

import * as admin from "firebase-admin";

type BaseMessage = {
	data?: { [key: string]: string };
	notification?: admin.messaging.Notification;
	android?: admin.messaging.AndroidConfig;
	webpush?: admin.messaging.WebpushConfig;
	apns?: admin.messaging.ApnsConfig;
	fcmOptions?: admin.messaging.FcmOptions;
};

type TokenMessage = BaseMessage & {
	token: string;
}

export type FirebaseType_PushMessages = admin.messaging.Messaging;
// export type FirebaseType_Message = admin.messaging.Message;
export type FirebaseType_Message = TokenMessage
export type FirebaseType_BatchResponse = admin.messaging.BatchResponse
export type FirebaseType_TopicResponse = admin.messaging.MessagingTopicResponse;
export type FirebaseType_MulticastMessage = admin.messaging.MulticastMessage;
export type FirebaseType_SubscriptionResponse = admin.messaging.MessagingTopicManagementResponse;
