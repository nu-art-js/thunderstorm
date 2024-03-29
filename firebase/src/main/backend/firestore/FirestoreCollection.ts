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

import {BadImplementationException, batchAction, exists, generateHex, StaticLogger, Subset, TS_Object} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentSnapshot} from './types';
import {Clause_Select, Clause_Where, FilterKeys, FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBE} from './FirestoreWrapperBE';
import {FirestoreInterface} from './FirestoreInterface';
import {FirestoreTransaction} from './FirestoreTransaction';
import {Transaction} from 'firebase-admin/firestore';


/**
 * FirestoreCollection is a class for handling Firestore collections. It takes in the name, FirestoreWrapperBE instance, and uniqueKeys as parameters.
 */
export class FirestoreCollection<Type extends TS_Object> {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBE;
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
	constructor(name: string, wrapper: FirestoreWrapperBE, uniqueKeys?: FilterKeys<Type>) {
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

				where[key] = instance[key];
				return where;
			}, {} as Clause_Where<Type>);
		};
	}

	/**
     Executes a Firestore query on the collection.
     @param ourQuery - The query to execute.
     @returns A Promise that resolves to an array of FirestoreType_DocumentSnapshot objects.
     @private
	 */
	private async _query(ourQuery?: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot[]> {
		const myQuery = FirestoreInterface.buildQuery(this, ourQuery);
		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot[];
	}

	/**

     Executes a unique Firestore query on the collection.
     @param ourQuery - The query to execute.
     @returns A Promise that resolves to a single FirestoreType_DocumentSnapshot object, or undefined if no match is found.
     @private
	 */
	private async _queryUnique(ourQuery: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot | undefined> {
		const results: FirestoreType_DocumentSnapshot[] = await this._query(ourQuery);
		return FirestoreInterface.assertUniqueDocument(results, ourQuery, this.name);
	}

	/**
     Executes a unique Firestore query on the collection and returns the matching object.
     @param ourQuery - The query to execute.
     @returns A Promise that resolves to the matching object, or undefined if no match is found.
	 */
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
		return this.wrapper.firestore.doc(`${this.name}/${id}`);
	}

	getUniqueFilter = () => this.externalUniqueFilter;

	async newQueryUnique(ourQuery: FirestoreQuery<Type>): Promise<DocWrapper<Type> | undefined> {
		const doc = await this._queryUnique(ourQuery) as FirestoreType_DocumentSnapshot<Type>;
		if (!doc || !doc.exists)
			return;

		return new DocWrapper<Type>(this.wrapper, doc);
	}

	async newQuery(ourQuery: FirestoreQuery<Type>): Promise<DocWrapper<Type>[]> {
		const docs = await this._query(ourQuery) as FirestoreType_DocumentSnapshot<Type>[];
		return docs.filter(doc => doc.exists).map(doc => new DocWrapper<Type>(this.wrapper, doc));
	}
}

export class DocWrapper<T extends TS_Object> {
	wrapper: FirestoreWrapperBE;
	doc: FirestoreType_DocumentSnapshot<T>;

	constructor(wrapper: FirestoreWrapperBE, doc: FirestoreType_DocumentSnapshot<T>) {
		this.wrapper = wrapper;
		this.doc = doc;
	}

	async runInTransaction<R>(processor: (transaction: Transaction) => Promise<R>) {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction(processor);
	}

	delete = async (transaction?: Transaction): Promise<T> => {
		if (!transaction) {
			// const item = this.doc.data();   TODO: TBD do we need a create and run in transaction for each delete??
			// this.doc.ref.delete();
			// return item;
			return this.runInTransaction(this.delete);
		}

		const item = this.get();
		transaction.delete(this.doc.ref);
		return item;
	};

	get = () => this.doc.data();

	set = async (instance: T, transaction?: Transaction): Promise<T> => {
		if (!transaction)
			return this.runInTransaction((_transaction) => this.set(instance, _transaction));

		transaction.set(this.doc.ref, instance);
		return instance;
	};
}