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

import {FirestoreType_DocumentSnapshot} from './types';
import {DocWrapper, FirestoreCollection,} from './FirestoreCollection';
import {BadImplementationException, merge, Subset, TS_Object} from '@nu-art/ts-common';
import {FirestoreQuery} from '../../shared/types';
import {FirestoreInterface} from './FirestoreInterface';
import {Transaction} from 'firebase-admin/firestore';


export class FirestoreTransaction {
	transaction: Transaction;

	constructor(transaction: Transaction) {
		this.transaction = transaction;
	}

	private async _query<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot[]> {
		const query = FirestoreInterface.buildQuery(collection, ourQuery);
		return (await this.transaction.get(query)).docs as FirestoreType_DocumentSnapshot[];
	}

	private async _queryUnique<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot | undefined> {
		const results: FirestoreType_DocumentSnapshot[] = await this._query(collection, ourQuery);
		return FirestoreInterface.assertUniqueDocument(results, ourQuery, collection.name);
	}

	private async _queryItem<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Subset<Type>): Promise<FirestoreType_DocumentSnapshot | undefined> {
		const ourQuery = FirestoreInterface.buildUniqueQuery(collection, instance);
		const results: FirestoreType_DocumentSnapshot[] = await this._query(collection, ourQuery);
		return FirestoreInterface.assertUniqueDocument(results, ourQuery, collection.name);
	}

	async query<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<Type[]> {
		return (await this._query(collection, ourQuery)).map(result => result.data() as Type);
	}

	async queryItem<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type): Promise<Type | undefined> {
		const ourQuery = FirestoreInterface.buildUniqueQuery(collection, instance);
		return this.queryUnique(collection, ourQuery);
	}

	async queryUnique<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<Type | undefined> {
		const doc = await this._queryUnique(collection, ourQuery);
		if (!doc)
			return;

		return doc.data() as Type;
	}

	async insert<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type, _id?: string) {
		const doc = collection.createDocumentReference(_id);
		try {
			await this.transaction.create(doc, instance);
		} catch (e: any) {
			console.error('Failed creating object: ', instance, e);
			throw e;
		}
		return instance;
	}

	async insertAll<Type extends TS_Object>(collection: FirestoreCollection<Type>, instances: Type[], _ids?: string[]) {
		return await Promise.all(instances.map((instance, i) => this.insert(collection, instance, _ids?.[i])));
	}

//------------------------
	async upsert<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type, _id?: string) {
		return (await this.upsert_Read(collection, instance, _id))();
	}

	async upsert_Read<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type, _id?: string) {
		const ref = await this.getOrCreateDocument(collection, instance, _id);

		return async () => {
			try {
				await this.transaction.set(ref, instance);
			} catch (e: any) {
				console.error('Failed creating object: ', instance, e);
				throw e;
			}
			return instance;
		};
	}

	async getOrCreateDocument<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type, _id?: string) {
		let ref = (await this._queryItem(collection, instance))?.ref;
		if (!ref)
			ref = collection.createDocumentReference(_id);
		return ref;
	}

	async upsertAll<Type extends TS_Object>(collection: FirestoreCollection<Type>, instances: Type[], _ids?: string[]): Promise<Type[]> {
		if (instances.length > 500)
			throw new BadImplementationException('Firestore transaction supports maximum 500 at a time');

		return (await this.upsertAll_Read(collection, instances, _ids))();
	}

	async upsertAll_Read<Type extends TS_Object>(collection: FirestoreCollection<Type>, instances: Type[], _ids?: string[]): Promise<() => Promise<Type[]>> {
		const writes = await Promise.all(instances.map(async (instance, i) => this.upsert_Read(collection, instance, _ids?.[i])));

		return async () => Promise.all(writes.map(async _write => _write()));
	}

	async patch<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Subset<Type>) {
		return (await this.patch_Read(collection, instance))();
	}

	async patch_Read<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Subset<Type>) {
		const doc = await this._queryItem(collection, instance);
		if (!doc)
			throw new BadImplementationException(`Patching a non existent doc for query ${FirestoreInterface.buildUniqueQuery(collection, instance)}`);

		return async () => {
			const patchedInstance = merge(await doc.data() as Type, instance);
			this.transaction.set(doc.ref, patchedInstance);
			return patchedInstance;
		};
	}

	async delete<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>) {
		return await (await this.delete_Read(collection, ourQuery))();
	}

	async delete_Read<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>) {
		const docs = await this._query(collection, ourQuery);

		if (docs.length > 500)
			throw new BadImplementationException(`Trying to delete ${docs.length} documents. Not allowed more then 5oo in a single transaction`);

		return async () => {
			const toReturn = docs.map(doc => doc.data() as Type);
			await Promise.all(docs.map(async (doc) => this.transaction.delete(doc.ref)));
			return toReturn;
		};
	}

	async deleteItem<Type extends TS_Object>(collection: FirestoreCollection<Type>, instance: Type) {
		return this.deleteUnique(collection, FirestoreInterface.buildUniqueQuery(collection, instance));
	}

	async deleteUnique<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<Type | undefined> {
		const write = await this.deleteUnique_Read(collection, ourQuery);
		if (!write)
			return;

		return write();
	}

	async deleteUnique_Read<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<undefined | (() => Promise<Type>)> {
		const doc = (await this._queryUnique(collection, ourQuery));
		if (!doc)
			return;

		return async () => {
			const result = doc.data() as Type;
			await this.transaction.delete(doc.ref);

			return result;
		};
	}

	async newQueryUnique<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<DocWrapper<Type> | undefined> {
		const doc = await this._queryUnique(collection, ourQuery) as FirestoreType_DocumentSnapshot<Type>;
		if (!doc || !doc.exists)
			return;

		return new DocWrapper<Type>(collection.wrapper, doc);
	}

	async newQuery<Type extends TS_Object>(collection: FirestoreCollection<Type>, ourQuery: FirestoreQuery<Type>): Promise<DocWrapper<Type>[]> {
		const docs = await this._query(collection, ourQuery) as FirestoreType_DocumentSnapshot<Type>[];
		return docs.filter(doc => doc.exists).map(doc => new DocWrapper<Type>(collection.wrapper, doc));
	}
}

