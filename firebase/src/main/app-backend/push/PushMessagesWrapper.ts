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
	FirebaseType_BatchResponse,
	FirebaseType_Message,
	FirebaseType_PushMessages,
	FirebaseType_SubscriptionResponse,
	FirebaseType_TopicResponse
} from "./types";
import {FirebaseBaseWrapper} from "../auth/FirebaseBaseWrapper";
import {FirebaseSession} from "../auth/firebase-session";
import {StringMap} from "@nu-art/ts-common";

export class PushMessagesWrapper
	extends FirebaseBaseWrapper {

	private readonly messaging: FirebaseType_PushMessages;

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.messaging = firebaseSession.app.messaging() as FirebaseType_PushMessages;
	}

	async send(message: FirebaseType_Message, dryRun?: boolean): Promise<string> {
		return this.messaging.send(message, dryRun);
	}

	async sendAll(messages: FirebaseType_Message[]): Promise<FirebaseType_BatchResponse> {
		return this.messaging.sendAll(messages);
	}

	async sendMultiCast(tokens: string[], data: StringMap): Promise<FirebaseType_BatchResponse> {
		return this.messaging.sendMulticast({data, tokens});
	}

	async sendToTopic(topic: string, data: StringMap, dryRun?: boolean): Promise<FirebaseType_TopicResponse> {
		return this.messaging.sendToTopic(topic, {data}, {dryRun})
	}

	async subscribeToTopic(tokens: string[], topic: string): Promise<FirebaseType_SubscriptionResponse> {
		return this.messaging.subscribeToTopic(tokens, topic)
	}

	async unsubscribeFromTopic(tokens: string[], topic: string): Promise<FirebaseType_SubscriptionResponse> {
		return this.messaging.unsubscribeFromTopic(tokens, topic)
	}
}