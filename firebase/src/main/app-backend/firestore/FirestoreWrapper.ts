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

import {FirestoreCollection,} from './FirestoreCollection';
import {FirestoreType, FirestoreType_Collection,} from './types';
import {FilterKeys} from '../../shared/types';
import {FirebaseSession} from '../auth/firebase-session';
import {FirebaseBaseWrapper} from '../auth/FirebaseBaseWrapper';
import {DB_Object, TS_Object} from '@nu-art/ts-common';
import {getFirestore} from 'firebase-admin/firestore';


export class FirestoreWrapper
	extends FirebaseBaseWrapper {

	readonly firestore: FirestoreType;
	private readonly collections: { [collectionName: string]: FirestoreCollection<any> } = {};

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.firestore = getFirestore(firebaseSession.app);
	}

	public getCollection<Type extends TS_Object>(name: string, externalFilterKeys?: FilterKeys<Type>): FirestoreCollection<Type> {
		const collection = this.collections[name];
		if (collection)
			return collection;

		return this.collections[name] = new FirestoreCollection<Type>(name, this, externalFilterKeys);
	}

	public listen<Type extends DB_Object>(collection: FirestoreCollection<Type>, doc: string) {
		collection.wrapper.firestore.doc(`${collection.name}/${doc}`).onSnapshot(_snapshot => {
			console.log('recieved snapshot!');
		});
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