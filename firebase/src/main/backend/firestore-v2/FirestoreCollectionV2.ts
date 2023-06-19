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
	BadImplementationException,
	batchAction,
	currentTimeMillis,
	DB_Object,
	exists,
	generateHex,
	PreDB,
	StaticLogger,
	Subset
} from '@nu-art/ts-common';
import {
	FirestoreType_Collection,
	FirestoreType_DocumentReference,
	FirestoreType_DocumentSnapshot
} from '../firestore/types';
import {Clause_Where, FilterKeys, FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV2} from './FirestoreInterfaceV2';
import {FirestoreTransaction} from '../firestore/FirestoreTransaction';

export const dbIdLength = 32;

type BatchOpMethod = 'delete' | 'set' | 'create' | 'update';
type BulkOpMethod = 'delete' | 'set' | 'create' | 'update';

/**
 * FirestoreCollection is a class for handling Firestore collections. It takes in the name, FirestoreWrapperBE instance, and uniqueKeys as parameters.
 */
export class FirestoreCollectionV2<Type extends DB_Object> {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBEV2;
	readonly collection: FirestoreType_Collection;

	/**
	 * External unique as in there must never ever be two that answer the same query
	 */
	readonly externalUniqueFilter: ((object: Subset<Type>) => Clause_Where<Type>);

	/**
	 * @param name
	 * @param wrapper
	 * @param uniqueKeys
	 */
	constructor(name: string, wrapper: FirestoreWrapperBEV2, uniqueKeys?: FilterKeys<Type>) {
		this.name = name;
		this.wrapper = wrapper;
		if (!/[a-z-]{3,}/.test(name))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.collection = wrapper.firestore.collection(name);
		this.externalUniqueFilter = (instance: Type) => {
			if (!uniqueKeys)
				throw new BadImplementationException('In order to use a unique query your collection MUST have a unique filter');

			return uniqueKeys.reduce((where, key: keyof Type) => {
				if (!exists(instance[key]))
					throw new BadImplementationException(
						`No where properties are allowed to be null or undefined.\nWhile querying collection '${this.name}' we found property '${String(key)}' to be '${where[key]}'`);

				// @ts-ignore
				where[key] = instance[key];
				return where;
			}, {} as Clause_Where<Type>);
		};
	}

	getDocumentRef(value: PreDB<Type>) {
		if (!exists(value._id))
			throw new BadImplementationException('Cannot create DocWrapper without _id!');

		const doc = this.wrapper.firestore.doc(`${this.name}/${value._id}`) as FirestoreType_DocumentReference<Type>;
		return new DocWrapperV2<Type>(this.wrapper, doc);
	}

	/**
	 * Get the db objects from the query
	 * @param ourQuery
	 */
	async queryInstances(ourQuery: FirestoreQuery<Type>): Promise<Type[]> {
		return (await this._query(ourQuery)).map(result => result.data() as Type);
	}

	private async _query(ourQuery?: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot[]> {
		const myQuery = FirestoreInterfaceV2.buildQuery(this, ourQuery);
		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot[];
	}

	/**
	 * Get DocWrappers per the db objects from the query
	 * @param ourQuery
	 */
	async newQuery(ourQuery: FirestoreQuery<Type>): Promise<DocWrapperV2<Type>[]> {
		const docs = await this._query(ourQuery) as FirestoreType_DocumentSnapshot<Type>[];
		return docs.filter(doc => doc.exists).map(doc => new DocWrapperV2<Type>(this.wrapper, doc.ref, doc.data()));
	}

	async getAll() {

	}

	async test_DeleteAll() {
		await this.collection.doc().delete();
	}

	private async assertInstance(dbInstance: Type, transaction?: FirestoreTransaction, request?: Express.Request) {
		await this.upgradeInstances([dbInstance]);
		await this.preUpsertProcessing(dbInstance, transaction, request);
		this.validateImpl(dbInstance);
		await this.assertUniqueness(dbInstance, transaction, request);
	}

	private upgradeInstances(dbInstances: Type[]) {
		//todo - maybe should be filled only in extending modules
	}

	private async preUpsertProcessing(dbInstance: Type, transaction?: FirestoreTransaction, request?: Express.Request) {
		//todo - maybe should be filled only in extending modules
	}

	/**
	 * Validate
	 * @param dbInstance dbObject to validate
	 * @private
	 */
	private validateImpl(dbInstance: Type) {
		//todo validation using validator
	}

	private assertUniqueness(dbInstance: Type, transaction?: FirestoreTransaction, request?: Express.Request) {
	}

	async insertAll(preDBInstances: PreDB<Type>[]) {
		// await this.batchOperation(preDBInstances, 'set');
		await this.bulkOperation(preDBInstances, 'set');
	}

	async bulkOperation(preDBInstances: PreDB<Type>[], method: BulkOpMethod) {
		return await batchAction(preDBInstances.map(this.prepareObjForInsert), 200, async (instances) => {
			const bulk = this.wrapper.firestore.bulkWriter();

			switch (method) {
				case 'set':
					return await instances.reduce((_bulk, instance) => {
						_bulk.set(this.getDocumentRef(instance).ref, instance);
						return _bulk;
					}, bulk).flush();
				default:
					break;
			}
		});
	}


	async batchOperation(preDBInstances: PreDB<Type>[], method: BatchOpMethod) {
		return await batchAction(preDBInstances.map(this.prepareObjForInsert), 200, async (instances) => {
			const batch = this.wrapper.firestore.batch();

			switch (method) {
				case 'set':
					return await instances.reduce((_batch, instance) => {
						return _batch.set(this.getDocumentRef(instance).ref, instance);
					}, batch).commit();
				default:
					break;
			}
		});

	}

	async insert(preDBInstance: PreDB<Type>) {
		const dbInstance = this.prepareObjForInsert(preDBInstance);
		await this.assertInstance(dbInstance);
		const doc = this.getDocumentRef(dbInstance);
		return doc.set(dbInstance);
	}

	protected generateId() {
		return generateHex(dbIdLength);
	}


	prepareObjForInsert(preDBObject: PreDB<Type>): Type {
		const now = currentTimeMillis();
		preDBObject._id = this.generateId();
		preDBObject.__updated = preDBObject.__created = now;

		return preDBObject as Type;
	}
}

export class DocWrapperV2<T extends DB_Object> {
	wrapper: FirestoreWrapperBEV2;
	ref: FirestoreType_DocumentReference<T>;
	data?: T;

	constructor(wrapper: FirestoreWrapperBEV2, ref: FirestoreType_DocumentReference<T>, data?: T) {
		this.wrapper = wrapper;
		this.ref = ref;
		this.data = data;
	}

	async runInTransaction<R>(processor: (transaction: Transaction) => Promise<R>) {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction(processor);
	}

	cleanCache = () => {
		delete this.data;
	};

	delete = async (transaction?: Transaction) => {
		if (transaction)
			transaction.delete(this.ref);
		else
			this.ref.delete();
	};

	fromCache = () => {
		this.data;
	};

	get = async (transaction?: Transaction) => {
		if (transaction)
			this.data = (await transaction.get(this.ref)).data() as T;

		return this.data ?? (this.data = (await this.ref.get()).data() as T);
	};

	set = async (instance: PreDB<T>, transaction?: Transaction): Promise<T> => {
		if (transaction)
			transaction.set(this.ref, instance as T);
		else
			await this.ref.set(instance as T);

		return instance as T;
	};
}