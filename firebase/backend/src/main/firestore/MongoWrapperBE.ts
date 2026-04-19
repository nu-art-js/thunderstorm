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

import {Database, DB_Prototype} from '@nu-art/db-api-shared';
import {Logger, Promise_all_sequentially, TypedMap} from '@nu-art/ts-common';
import {MongoCollection} from './MongoCollection.js';
import {FirestoreCollectionHooks} from './FirestoreCollection.js';
import {getActiveTransaction, MemKey_FirestoreTransaction} from './consts.js';
import type {Db as MongoDriverDb, MongoClient} from 'mongodb';
import {MemStorage} from '@nu-art/ts-common/mem-storage';


export const CONST_MONGODB_EMULATOR_HOST = 'MONGODB_EMULATOR_HOST';

export class MongoWrapperBE
	extends Logger {

	private static instances: TypedMap<MongoWrapperBE> = {};

	static isEmulator(): boolean {
		return !!process.env[CONST_MONGODB_EMULATOR_HOST];
	}

	static getOrCreate(client: MongoClient, dbName: string): MongoWrapperBE {
		const key = dbName;
		if (this.instances[key])
			return this.instances[key];

		return this.instances[key] = new MongoWrapperBE(client, dbName);
	}

	readonly client: MongoClient;
	readonly db: MongoDriverDb;
	private readonly collections: { [collectionName: string]: MongoCollection<any> } = {};

	constructor(client: MongoClient, dbName: string) {
		super();
		this.client = client;
		this.db = client.db(dbName);
	}

	runTransaction = async <ReturnType>(processor: () => Promise<ReturnType>, label?: string): Promise<ReturnType> => {
		if (getActiveTransaction())
			return processor();

		const tag = label ?? 'MongoWrapper';
		const postTransactionActions: (() => Promise<any>)[] = [];
		const session = this.client.startSession();
		this.logDebug(`TX-START [${tag}]`);
		try {
			let result: ReturnType;
			const parentStorage = MemStorage.getStore();
			await session.withTransaction(async () => {
				await new MemStorage().init(async () => {
					const wrapper = {transaction: session as any, active: true};
					MemKey_FirestoreTransaction.set(wrapper);

					// @ts-ignore
					session.postTransaction = (action: () => Promise<any>) => {
						postTransactionActions.push(action);
					};

					try {
						result = await processor();
					} finally {
						wrapper.active = false;
					}
				}, parentStorage);
			});
			this.logDebug(`TX-END [${tag}]`);
			await Promise_all_sequentially(postTransactionActions);
			return result!;
		} finally {
			await session.endSession();
		}
	};

	public getCollection<Proto extends DB_Prototype>(dbDef: Database<Proto>, hooks?: FirestoreCollectionHooks<Proto['dbType']>): MongoCollection<Proto> {
		const existing = this.collections[dbDef.dbKey];
		if (existing)
			return existing;

		return this.collections[dbDef.dbKey] = new MongoCollection<Proto>(this.db, dbDef, hooks);
	}

	public async listCollections(): Promise<string[]> {
		const collections = await this.db.listCollections().toArray();
		return collections.map(c => c.name);
	}
}
