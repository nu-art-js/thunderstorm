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

import {FirestoreCollectionHooks, FirestoreCollectionV2,} from './FirestoreCollectionV2';
import {FirestoreType, FirestoreType_Collection,} from '../firestore/types';
import {FirebaseSession} from '../auth/firebase-session';
import {FirebaseBaseWrapper} from '../auth/FirebaseBaseWrapper';
import {DB_Object, DBDef, Default_UniqueKey, PreDB} from '@nu-art/ts-common';
import {DocumentReference, getFirestore, Transaction,} from 'firebase-admin/firestore';


export class FirestoreWrapperBEV2
	extends FirebaseBaseWrapper {

	readonly firestore: FirestoreType;
	private readonly collections: { [collectionName: string]: FirestoreCollectionV2<any, any> } = {};

	constructor(firebaseSession: FirebaseSession<any>) {
		super(firebaseSession);
		this.firestore = getFirestore(firebaseSession.app);
	}

	runTransaction = async <ReturnType>(processor: (transaction: Transaction) => Promise<ReturnType>, transaction?: Transaction): Promise<ReturnType> => {
		if (transaction) // if a transaction was provided to be used, use it
			return processor(transaction);

		return this.firestore.runTransaction<ReturnType>(async (transaction: Transaction) => {
			const writeActions: (() => void)[] = [];

			// @ts-ignore
			transaction.__nu_art__WriteActions = writeActions;
			const originSet = transaction.set.bind(transaction);
			const originDelete = transaction.delete.bind(transaction);
			const originCreate = transaction.create.bind(transaction);

			transaction.set = <T>(documentRef: FirebaseFirestore.DocumentReference<T>, data: FirebaseFirestore.WithFieldValue<T>) => {
				writeActions.push(() => originSet(documentRef, data));
				return transaction;
			};

			transaction.create = <T>(documentRef: FirebaseFirestore.DocumentReference<T>, data: FirebaseFirestore.WithFieldValue<T>) => {
				writeActions.push(() => originCreate(documentRef, data));
				return transaction;
			};

			transaction.delete = (documentRef: DocumentReference<any>, precondition?: FirebaseFirestore.Precondition) => {
				writeActions.push(() => originDelete(documentRef, precondition));
				return transaction;
			};

			const toRet = await processor(transaction);

			writeActions.forEach(action => action());

			return toRet;
		});
	};

	public getCollection<Type extends DB_Object, Ks extends keyof PreDB<Type> = Default_UniqueKey>(dbDef: DBDef<Type, Ks>, hooks?: FirestoreCollectionHooks<Type>): FirestoreCollectionV2<Type, Ks> {
		const collection = this.collections[dbDef.dbName];
		if (collection)
			return collection;

		return this.collections[dbDef.dbName] = new FirestoreCollectionV2<Type, Ks>(this, dbDef, hooks);
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

	isEmulator(): boolean {
		return !!process.env.FIRESTORE_EMULATOR_HOST || false;
	}
}