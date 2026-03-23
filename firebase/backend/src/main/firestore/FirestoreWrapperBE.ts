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

import {FirestoreCollectionHooks, FirestoreCollection,} from './FirestoreCollection.js';
import {FirestoreType, FirestoreType_Collection,} from './types.js';
import {FirebaseSession} from '../auth/firebase-session.js';
import {FirebaseBaseWrapper} from '../auth/FirebaseBaseWrapper.js';
import {Database, DB_Prototype} from '@nu-art/db-api-shared';
import {DB_Object, Promise_all_sequentially, UniqueId} from '@nu-art/ts-common';
import {DocumentReference, DocumentSnapshot, getFirestore, Query, QueryDocumentSnapshot, QuerySnapshot, Transaction,} from 'firebase-admin/firestore';


export class FirestoreWrapperBE
	extends FirebaseBaseWrapper {

	readonly firestore: FirestoreType;
	private readonly collections: { [collectionName: string]: FirestoreCollection<any> } = {};

	constructor(firebaseSession: FirebaseSession<any>, dbName?: string) {
		super(firebaseSession);
		if (dbName)
			this.firestore = getFirestore(firebaseSession.app, dbName);
		else
			this.firestore = getFirestore(firebaseSession.app);
	}

	runTransaction = async <ReturnType>(processor: (transaction: Transaction) => Promise<ReturnType>, transaction?: Transaction): Promise<ReturnType> => {
		if (transaction) // if a transaction was provided to be used, use it
			return processor(transaction);

		const postTransactionActions: (() => Promise<any>)[] = [];
		const toRet = await this.firestore.runTransaction<ReturnType>(async (transaction: Transaction) => {
			const writeActions: (() => void)[] = [];
			const transactionUpdates: { [id: UniqueId]: DocumentSnapshot<any> } = {};

			// @ts-ignore
			transaction.postTransaction = (action: () => Promise<any>) => {
				return postTransactionActions.push(action);
			};

			// @ts-ignore
			transaction.__nu_art__WriteActions = writeActions;
			const originSet = transaction.set.bind(transaction);
			const originDelete = transaction.delete.bind(transaction);
			const originCreate = transaction.create.bind(transaction);
			const originGet = transaction.get.bind(transaction);
			const originGetAll = transaction.getAll.bind(transaction);

			const getMockDocumentSnapshot = <T extends DB_Object>(data: T, _id: UniqueId, exists = true) => {
				return {
					id: _id,
					ref: {} as any, // Mock DocumentReference
					exists,
					data: () => (exists ? data : undefined),
					get: (fieldPath: string) => (data as any)[fieldPath],
					metadata: {} as any, // Mock metadata
				} as unknown as DocumentSnapshot<T>;
			};

			const updateTransactionUpdates = async <T extends DB_Object>(data: T | DocumentReference<T>, exists: boolean = true) => {
				let _data: DB_Object;
				let _id: UniqueId;

				if (data instanceof DocumentReference) {
					_id = data.id;
					_data = (await data.get()).data() as DB_Object;
				} else {
					_id = data._id;
					_data = data;
				}

				transactionUpdates[_id] = getMockDocumentSnapshot(_data, _id, exists);
			};

			transaction.set = <T>(documentRef: FirebaseFirestore.DocumentReference<T>, data: FirebaseFirestore.WithFieldValue<T>) => {
				updateTransactionUpdates(data as DB_Object);
				writeActions.push(() => originSet(documentRef, data));
				return transaction;
			};

			transaction.create = <T>(documentRef: FirebaseFirestore.DocumentReference<T>, data: FirebaseFirestore.WithFieldValue<T>) => {
				updateTransactionUpdates(data as DB_Object);
				writeActions.push(() => originCreate(documentRef, data));
				return transaction;
			};

			transaction.delete = (documentRef: DocumentReference<any>, precondition?: FirebaseFirestore.Precondition) => {
				// update deletions
				updateTransactionUpdates(documentRef, false);
				writeActions.push(() => originDelete(documentRef, precondition));
				return transaction;
			};

			// @ts-ignore
			transaction.get = async (args: Query<any> | DocumentReference<any>) => {
				// @ts-ignore
				const doc: FirebaseFirestore.QuerySnapshot<any> | FirebaseFirestore.DocumentSnapshot<any> = await originGet(args);

				// handle doc snapshot
				if (doc instanceof DocumentSnapshot) {
					const document: any | undefined = doc.data();

					if (!document)
						return doc;

					return transactionUpdates[document._id] ?? doc;
				}

				// handle query snapshot
				if (doc instanceof QuerySnapshot) {
					const docs = doc.docs;

					// @ts-ignore
					return {
						docs: docs.map(doc => {
							const _doc = doc.data();
							if (!_doc) return doc;

							return transactionUpdates[(_doc as DB_Object)._id] ?? doc;
						}) as QueryDocumentSnapshot<any>[]
					};
				}

				return doc;
			};

			// @ts-ignore
			transaction.getAll = async <T>(...documentRefsOrReadOptions: DocumentReference<T>[]) => {
				const docs = await originGetAll(...documentRefsOrReadOptions);
				return docs.map(doc => {
					const _doc = doc.data();
					if (!_doc)
						return doc;

					return transactionUpdates[(_doc as unknown as DB_Object)._id] ?? doc;
				});
			};

			const toRet = await processor(transaction);
			writeActions.forEach(action => action());

			return toRet;
		});

		await Promise_all_sequentially(postTransactionActions);
		return toRet;
	};

	public getCollection<Proto extends DB_Prototype>(dbDef: Database<Proto>, hooks?: FirestoreCollectionHooks<Proto['dbType']>): FirestoreCollection<Proto> {
		const collection = this.collections[dbDef.dbKey];
		if (collection)
			return collection;

		return this.collections[dbDef.dbKey] = new FirestoreCollection<Proto>(this, dbDef, hooks);
	}

	public listen<Proto extends DB_Prototype>(collection: FirestoreCollection<Proto>, doc: string) {
		collection.wrapper.firestore.doc(`${collection.collection.path}/${doc}`).onSnapshot(() => {
			this.logInfo('received snapshot!');
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