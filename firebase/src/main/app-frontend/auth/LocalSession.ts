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

/**
 * Created by tacb0ss on 19/09/2018.
 */
import * as firebase from 'firebase/app';
import {ThisShouldNotHappenException} from "@nu-art/ts-common";
import {FirebaseSession} from "./firebase-session";
// tslint:disable:no-import-side-effect
import 'firebase/messaging';
import {MessagingWrapper} from '../messaging/MessagingWrapper';

export class LocalSession
	extends FirebaseSession {

	protected messaging!: MessagingWrapper;

	public connect(): void {
		this.app = firebase.initializeApp(this.config);
		this.messaging = new MessagingWrapper(this.app.messaging())
	}

	getMessaging() {
		return this.messaging;
	}

	getProjectId(): string {
		if (!this.config)
			throw new ThisShouldNotHappenException("Missing config. Probably init not resolved yet!")

		if (!this.config.projectId)
			throw new ThisShouldNotHappenException("Could not deduce project id from session config.. if you need the functionality.. add it to the config!!")

		return this.config.projectId;
	}
}

