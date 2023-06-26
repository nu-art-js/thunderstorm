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

import {FirestoreCollectionV2,} from './FirestoreCollectionV2';
import {FirestoreType, FirestoreType_Collection,} from '../firestore/types';
import {FilterKeys} from '../../shared/types';
import {FirebaseSession} from '../auth/firebase-session';
import {FirebaseBaseWrapper} from '../auth/FirebaseBaseWrapper';
import {DB_Object, DBDef} from '@nu-art/ts-common';
import {getFirestore} from 'firebase-admin/firestore';


export class FirestoreWrapperBEV2
	extends FirebaseBaseWrapper {

	readonly firestore: FirestoreType;
	private readonly collections: { [collectionName: string]: FirestoreCollectionV2<any> } = {};

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.firestore = getFirestore(firebaseSession.app);
	}

	public getCollection<Type extends DB_Object>(dbDef: DBDef<Type>, uniqueKeys?: FilterKeys<Type>): FirestoreCollectionV2<Type> {
		const collection = this.collections[dbDef.dbName];
		if (collection)
			return collection;

		return this.collections[dbDef.dbName] = new FirestoreCollectionV2<Type>(this, dbDef, uniqueKeys);
	}

	public listen<Type extends DB_Object>(collection: FirestoreCollectionV2<Type>, doc: string) {
		collection.wrapper.firestore.doc(`${collection.name}/${doc}`).onSnapshot(_snapshot => {
			this.logInfo('recieved snapshot!');
		});
	}

	// public async deleteCollection(name: string) {
	// 	return this.getCollection(name).deleteAll();
	// }

	public async listCollections(): Promise<FirestoreType_Collection[]> {
		if (!this.firestore.listCollections)
			return [];

		return this.firestore.listCollections();
	}
}