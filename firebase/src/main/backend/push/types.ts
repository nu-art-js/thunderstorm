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

import {
	Notification,
	AndroidConfig,
	WebpushConfig,
	ApnsConfig,
	FcmOptions,
	Messaging,
	BatchResponse,
	MessagingTopicResponse,
	MulticastMessage,
	MessagingTopicManagementResponse,
} from 'firebase-admin/messaging';
import {TypedMap} from '@nu-art/ts-common';


type BaseMessage = {
	data?: TypedMap<string>;
	notification?: Notification;
	android?: AndroidConfig;
	webpush?: WebpushConfig;
	apns?: ApnsConfig;
	fcmOptions?: FcmOptions;
};

type TokenMessage = BaseMessage & {
	token: string;
}

export type FirebaseType_PushMessages = Messaging;
// export type FirebaseType_Message = Message;
export type FirebaseType_Message = TokenMessage
export type FirebaseType_BatchResponse = BatchResponse
export type FirebaseType_TopicResponse = MessagingTopicResponse;
export type FirebaseType_MulticastMessage = MulticastMessage;
export type FirebaseType_SubscriptionResponse = MessagingTopicManagementResponse;
