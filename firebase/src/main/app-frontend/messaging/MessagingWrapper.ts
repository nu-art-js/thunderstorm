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

import {Logger} from "@nu-art/ts-common";
import {FirebaseType_Messaging, FirebaseType_Unsubscribe} from "./types";
import {getToken, GetTokenOptions, MessagePayload, NextFn, Observer, onMessage} from "firebase/messaging";

export class MessagingWrapper
	extends Logger {

	private readonly messaging: FirebaseType_Messaging;
	private callback?: NextFn<MessagePayload> | Observer<MessagePayload>;
	private token?: string;

	constructor(messaging: FirebaseType_Messaging) {
		super();
		this.messaging = messaging;
	}

	async getToken(options?: GetTokenOptions): Promise<string> {
		this.token = await getToken(this.messaging,options);
		if (this.callback)
			onMessage(this.messaging, this.callback);

		return this.token;
	}

	onMessage(callback: NextFn<MessagePayload> | Observer<MessagePayload>): FirebaseType_Unsubscribe | void {
		this.callback = callback;
		if (!this.token)
			return;

		return onMessage(this.messaging, callback);
	}
}