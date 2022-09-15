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

import {BadImplementationException, batchAction, DB_Object, generateHex, Subset, TS_Object} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentSnapshot} from './types';
import {Clause_Select, Clause_Where, FilterKeys, FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBE} from './FirestoreWrapperBE';
import {FirestoreInterface} from './FirestoreInterface';
import {FirestoreTransaction} from './FirestoreTransaction';
import {Transaction} from 'firebase-admin/firestore';
import {DocumentReference} from '@google-cloud/firestore';


export class FirestoreCollection<Type extends TS_Object> {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBE;
	readonly collection: FirestoreType_Collection;

	/**
	 * External unique as in there must never ever be two that answer the same query
	 */
	readonly externalUniqueFilter: ((object: Subset<Type>) => Clause_Where<Type>);

	constructor(name: string, wrapper: FirestoreWrapperBE, uniqueKeys?: FilterKeys<Type>) {
		this.name = name;
		this.wrapper = wrapper;
		if (!/[a-z-]{3,}/.test(name))
			console.log('Please follow name pattern for collections /[a-z-]{3,}/');

		this.collection = wrapper.firestore.collection(name);
		this.externalUniqueFilter = (instance: Type) => {
			if (!uniqueKeys)
				throw new BadImplementationException('In order to use a unique query your collection MUST have a unique filter');

			return uniqueKeys.reduce((where, key: keyof Type) => {
				// @ts-ignore
				where[key] = instance[key];
				return where;
			}, {} as Clause_Where<Type>);
		};
	}

	private async _query(ourQuery?: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot<Type>[]> {
		const myQuery = FirestoreInterface.buildQuery(this, ourQuery);
		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot<Type>[];
	}

	private async _queryUnique(ourQuery: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot<Type> | undefined> {
		const results = await this._query(ourQuery);
		return FirestoreInterface.assertUniqueDocument<Type>(results, ourQuery, this.name);
	}

	async queryUnique(ourQuery: FirestoreQuery<Type>): Promise<Type | undefined> {
		const doc = await this._queryUnique(ourQuery);
		if (!doc)
			return;

		return doc.data() as Type;
	}

	async insert(instance: Type, _id?: string): Promise<Type> {
		await this.createDocumentReference(_id).set(instance);
		return instance;
	}

	async insertAll(instances: Type[]) {
		return await Promise.all(instances.map(instance => this.insert(instance)));
	}

	async query(ourQuery: FirestoreQuery<Type>): Promise<Type[]> {
		return (await this._query(ourQuery)).map(result => result.data() as Type);
	}

	async upsert(instance: Type): Promise<Type> {
		return this.runInTransaction((transaction) => transaction.upsert(this, instance));
	}

	async upsertAll(instances: Type[]) {
		return batchAction(instances, 500, async chunked => this.runInTransaction(transaction => transaction.upsertAll(this, chunked)));
	}

	async patch(instance: Subset<Type>): Promise<Type> {
		return this.runInTransaction(transaction => transaction.patch(this, instance));
	}

	async deleteItem(instance: Type): Promise<Type | undefined> {
		return this.runInTransaction((transaction) => transaction.deleteItem(this, instance));
	}

	async deleteUnique(query: FirestoreQuery<Type>): Promise<Type | undefined> {
		return this.runInTransaction((transaction) => transaction.deleteUnique(this, query));
	}

	async delete(query: FirestoreQuery<Type>) {
		const docRefs = await this._query(query);
		return this.deleteBatch(docRefs);
	}

	private async deleteBatch(docRefs: FirestoreType_DocumentSnapshot[]) {
		return await batchAction(docRefs, 200, async (chunk) => {
			const batch = this.wrapper.firestore.batch();
			const toRet: Type[] = [];

			await chunk.reduce((_batch, val) => {
				toRet.push(val.data() as unknown as Type);
				return _batch.delete(val.ref);
			}, batch).commit();

			return toRet;
		});
	}

	async deleteAll() {
		const docRefs = await this._query();
		return this.deleteBatch(docRefs);
	}

	async getAll(select?: Clause_Select<Type>): Promise<Type[]> {
		return this.query({select} as FirestoreQuery<Type>);
	}

	async runInTransaction<ReturnType>(processor: (transaction: FirestoreTransaction) => Promise<ReturnType>): Promise<ReturnType> {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction<ReturnType>(async (transaction: Transaction) => {
			return processor(new FirestoreTransaction(transaction));
		});
	}

	createDocumentReference(_id?: string) {
		const id = _id || generateHex(16);
		return this.wrapper.firestore.doc(`${this.name}/${id}`) as DocumentReference<Type>;
	}

	newDocument(dbObject: DB_Object) {
		return new DocWrapper<Type>(this.wrapper, this.createDocumentReference(dbObject._id), dbObject as unknown as Type);
	}

	getUniqueFilter = () => this.externalUniqueFilter;

	async newQueryUnique(ourQuery: FirestoreQuery<Type>) {
		const doc = await this._queryUnique(ourQuery);
		if (!doc || !doc.exists)
			return;

		return new DocWrapper<Type>(this.wrapper, doc.ref, doc.data());
	}

	async newQueryItem(item: Type) {
		// can optimize by accessing the doc ref by explicit path: /${collectionName}/${item._id}
		const ourQuery = FirestoreInterface.buildUniqueQuery(this, item);
		return this.newQueryUnique(ourQuery);
	}

	async newQuery(ourQuery: FirestoreQuery<Type>): Promise<DocWrapper<Type>[]> {
		const docs = await this._query(ourQuery) as FirestoreType_DocumentSnapshot<Type>[];
		return docs.filter(doc => doc.exists).map(doc => new DocWrapper<Type>(this.wrapper, doc.ref, doc.data()));
	}
}

export class DocWrapper<T extends TS_Object> {
	wrapper: FirestoreWrapperBE;
	cache: T;
	ref: DocumentReference<T>;

	constructor(wrapper: FirestoreWrapperBE, ref: DocumentReference<T>, cache: T) {
		this.wrapper = wrapper;
		this.cache = cache;
		this.ref = ref;
	}

	async runInTransaction<R>(processor: (transaction: Transaction) => Promise<R>) {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction(processor);
	}

	setCache = (cache: T) => this.cache = cache;

	delete = async (transaction?: Transaction): Promise<T | undefined> => {
		if (!transaction)
			return this.runInTransaction(this.delete);

		const item = this.get();
		transaction.delete(this.ref);
		return item;
	};

	get = () => {
		return this.cache;
	};

	// get = async () => {
	// 	if (!this.cache)
	// 		this.cache = (await this.ref.get()).data();
	//
	// 	return this.cache;
	// };

	set = async (instance: T, transaction?: Transaction): Promise<T> => {
		if (!transaction)
			return this.runInTransaction((transaction) => this.set(instance, transaction));

		transaction.set(this.ref, instance);
		return instance;
	};
}