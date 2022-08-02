/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import * as messaging from 'firebase-admin/messaging';

type BaseMessage = {
	data?: { [key: string]: string };
	notification?: messaging.Notification;
	android?: messaging.AndroidConfig;
	webpush?: messaging.WebpushConfig;
	apns?: messaging.ApnsConfig;
	fcmOptions?: messaging.FcmOptions;
};

type TokenMessage = BaseMessage & {
	token: string;
}

export type FirebaseType_PushMessages = messaging.Messaging;
// export type FirebaseType_Message = messaging.Message;
export type FirebaseType_Message = TokenMessage
export type FirebaseType_BatchResponse = messaging.BatchResponse
export type FirebaseType_TopicResponse = messaging.MessagingTopicResponse;
export type FirebaseType_MulticastMessage = messaging.MulticastMessage;
export type FirebaseType_SubscriptionResponse = messaging.MessagingTopicManagementResponse;
