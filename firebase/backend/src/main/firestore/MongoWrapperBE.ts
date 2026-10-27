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
import {ImplementationMissingException, Logger, Promise_all_sequentially, TypedMap} from '@nu-art/ts-common';
import {MongoCollection} from './MongoCollection.js';
import {FirestoreCollectionHooks} from './FirestoreCollection.js';
import {drainTransactionPreClose, getActiveTransaction, MemKey_FirestoreTransaction} from './consts.js';
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

	client?: MongoClient;
	db?: MongoDriverDb;
	private readonly dbName: string;
	private readonly openClient?: () => Promise<MongoClient>;
	private opening?: Promise<MongoClient>;
	private readonly collections: { [collectionName: string]: MongoCollection<any> } = {};

	constructor(client: MongoClient | (() => Promise<MongoClient>), dbName: string) {
		super();
		this.dbName = dbName;
		if (typeof client === 'function') {
			this.openClient = client;
			return;
		}

		this.client = client;
		this.db = client.db(dbName);
	}

	private clientReady(): Promise<MongoClient> {
		if (this.client)
			return Promise.resolve(this.client);

		if (!this.opening) {
			this.opening = this.open().catch(err => {
				this.opening = undefined;
				throw err;
			});
		}

		return this.opening;
	}

	private async open(): Promise<MongoClient> {
		if (!this.openClient)
			throw new ImplementationMissingException('Mongo client is not open');

		const client = await this.openClient();
		this.client = client;
		this.db = client.db(this.dbName);
		return client;
	}

	runTransaction = async <ReturnType>(processor: () => Promise<ReturnType>, label?: string): Promise<ReturnType> => {
		if (getActiveTransaction())
			return processor();

		const tag = label ?? 'MongoWrapper';
		const postTransactionActions: (() => Promise<any>)[] = [];
		const client = await this.clientReady();
		const session = client.startSession();
		this.logDebug(`TX-START [${tag}]`);
		try {
			let result: ReturnType;
			const wrapper = {
				transaction: session as any,
				active: true,
				writeCount: 0,
				beginTransaction: () => session.startTransaction(),
			};
			const parentStorage = MemStorage.getStore();
			try {
				await new MemStorage().init(async () => {
					MemKey_FirestoreTransaction.set(wrapper);

					// @ts-ignore
					session.postTransaction = (action: () => Promise<any>) => {
						postTransactionActions.push(action);
					};

					result = await processor();
					await drainTransactionPreClose(wrapper);
				}, parentStorage);
			} catch (e) {
				wrapper.active = false;
				if (wrapper.writeCount > 0)
					await session.abortTransaction();

				throw e;
			}

			wrapper.active = false;
			if (wrapper.writeCount > 0)
				await session.commitTransaction();

			this.logDebug(`TX-END [${tag}] writes=${wrapper.writeCount}`);
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

		return this.collections[dbDef.dbKey] = new MongoCollection<Proto>(() => this.clientReady().then(ready => ready.db(this.dbName)), dbDef, hooks);
	}

	/** Drops cached handles so the next operation opens a new client. */
	invalidate(): void {
		this.client = undefined;
		this.db = undefined;
		this.opening = undefined;
		for (const collection of Object.values(this.collections))
			collection.release();
	}

	public async listCollections(): Promise<string[]> {
		const client = await this.clientReady();
		const collections = await client.db(this.dbName).listCollections().toArray();
		return collections.map(c => c.name);
	}
}
