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

import {FirestoreCollection,} from "./FirestoreCollection";
import {
	FirestoreType,
	FirestoreType_Collection,
} from "./types";
import {FilterKeys} from "../../shared/types";
import {FirebaseSession} from "../auth/firebase-session";
import {FirebaseBaseWrapper} from "../auth/FirebaseBaseWrapper";


export class FirestoreWrapper
	extends FirebaseBaseWrapper {

	readonly firestore: FirestoreType;
	private readonly collections: { [collectionName: string]: FirestoreCollection<any> } = {};

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.firestore = firebaseSession.app.firestore();
	}

	public getCollection<Type extends object>(name: string, externalFilterKeys?: FilterKeys<Type>): FirestoreCollection<Type> {
		const collection = this.collections[name];
		if (collection)
			return collection;

		return this.collections[name] = new FirestoreCollection<Type>(name, this, externalFilterKeys);
	}

	public async deleteCollection(name: string) {
		return this.getCollection(name).deleteAll();
	}

	public async listCollections(): Promise<FirestoreType_Collection[]> {
		if (!this.firestore.listCollections)
			return [];

		return this.firestore.listCollections();
	}
}