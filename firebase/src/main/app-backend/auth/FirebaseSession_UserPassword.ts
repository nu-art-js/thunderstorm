// /*
//  * Firebase is a simpler Typescript wrapper to all of firebase services.
//  *
//  * Copyright (C) 2020 Intuition Robotics
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
// /**
//  * Created by tacb0ss on 19/09/2018.
//  */
//
// import {
// 	auth,
// 	initializeApp
// } from "firebase";
//
// import {
// 	Firebase_UserCredential,
// 	FirebaseSession
// } from "./firebase-session";
//
//
// export class FirebaseSession_UserPassword
// 	extends FirebaseSession<Firebase_UserCredential> {
//
// 	private userCredential!: auth.UserCredential;
//
// 	constructor(config: Firebase_UserCredential, sessionName: string) {
// 		super(config, sessionName, false);
// 	}
//
// 	getProjectId(): string {
// 		return this.sessionName;
// 	}
//
// 	public async connect() {
// 		this.logDebug(`Connecting to firebase with config: ${this.config.config.id}`);
// 		this.app = initializeApp(this.config.config, this.config.config.id);
// 		this.userCredential = await auth(this.app).signInWithEmailAndPassword(this.config.credentials.user, this.config.credentials.password);
// 		const user = this.userCredential.user && this.userCredential.user;
// 		this.logDebug(`User: ${JSON.stringify(user)}`);
// 	}
// }
