/*
 * Database API Generator is a utility library for Thunderstorm.
 *
 * Given proper configurations it will dynamically generate APIs to your Firestore
 * collections, will assert uniqueness and restrict deletion... and more
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

import {Clause_Where, FilterKeys, FirestoreQuery,} from '@nu-art/firebase';
import {
	__stringify,
	_keys,
	addItemToArray,
	BadImplementationException,
	batchAction,
	currentTimeMillis,
	Day,
	DB_Object,
	Dispatcher,
	flatArray,
	generateHex,
	isErrorOfType,
	merge,
	Module,
	PreDB,
	tsValidate,
	ValidationException,
	ValidatorTypeResolver
} from '@nu-art/ts-common';

import {IndexKeys} from '@nu-art/thunderstorm';
import {ApiException, ExpressRequest, FirestoreBackupDetails, OnFirestoreBackupSchedulerAct} from '@nu-art/thunderstorm/backend';
import {FirebaseModule, FirestoreCollection, FirestoreInterface, FirestoreTransaction,} from '@nu-art/firebase/backend';
import {dbIdLength} from '../shared/validators';
import {DBApiBEConfig, getModuleBEConfig} from './db-def';
import {DBDef} from '../shared/db-def';
import {ModuleBE_SyncManager} from './ModuleBE_SyncManager';
import {Response_DBSync} from '../shared';


export type BaseDBApiConfig = {
	projectId?: string,
	maxChunkSize: number
}

export type DBApiConfig<Type extends DB_Object> = BaseDBApiConfig & DBApiBEConfig<Type>

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export abstract class BaseDB_ModuleBE<DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>
	extends Module<ConfigType>
	implements OnFirestoreBackupSchedulerAct {

	private defaultDispatcher?: Dispatcher<any, string, [DBType[]], string[]>;
	public collection!: FirestoreCollection<DBType>;
	private validator: ValidatorTypeResolver<DBType>;
	readonly dbDef: DBDef<DBType, any>;

	protected constructor(dbDef: DBDef<DBType, any>, appConfig?: BaseDBApiConfig) {
		super();

		const config = getModuleBEConfig(dbDef);

		const preConfig = {...config, ...appConfig};
		// @ts-ignore
		this.setDefaultConfig(preConfig);
		this.validator = config.validator;
		this.dbDef = dbDef;
	}

	setDefaultDispatcher(defaultDispatcher?: Dispatcher<any, string, [DBType[]], string[]>) {
		this.defaultDispatcher = defaultDispatcher;
	}

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = FirebaseModule.createAdminSession(this.config?.projectId).getFirestore();
		this.collection = firestore.getCollection<DBType>(this.config.collectionName, this.config.uniqueKeys as FilterKeys<DBType>);
	}

	getCollectionName() {
		return this.config.collectionName;
	}

	getItemName() {
		return this.config.itemName;
	}

	__onFirestoreBackupSchedulerAct(): FirestoreBackupDetails<DBType>[] {
		return [{
			backupQuery: this.resolveBackupQuery(),
			collection: this.collection,
			keepInterval: 7 * Day,
			minTimeThreshold: Day,
			moduleKey: this.config.collectionName
		}];
	}

	protected resolveBackupQuery(): FirestoreQuery<DBType> {
		return {where: {}};
	}

	/**
	 * Deletes a unique document based on its `_id`. Uses a transaction, after deletion assertions occur.
	 *
	 * @param _id - The _id of the object to be deleted.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @throws `ApiException` when the document doesn't exist in the collection.
	 *
	 * @returns
	 * A promise of the document that was deleted.
	 */
	async deleteUnique(_id: string): Promise<DBType> {
		return this.runInTransaction(async transaction => {
			const doc = await transaction.newQueryUnique(this.collection, {where: {_id} as Clause_Where<DBType>});
			if (!doc)
				throw new ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);

			await this.canDeleteDocument(transaction, [doc.get()]);
			const item = await doc.delete(transaction.transaction);
			await ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, [item], this.config.uniqueKeys, transaction);
			return item;
		});
	}

	/**
	 * Calls the `delete` method of the module's collection.
	 *
	 * @param deleteQuery - The query to be executed for the deletion.
	 * @param toReturn
	 */
	async delete(deleteQuery: FirestoreQuery<DBType>, toReturn: DBType[] = []) {
		const limit = 250;
		toReturn.push(...await this.runInTransaction(async transaction => {
			const docs = await transaction.newQuery(this.collection, {...deleteQuery, limit: deleteQuery.limit || limit});
			const items = docs.map(doc => doc.get());
			await this.canDeleteDocument(transaction, items);

			await Promise.all(docs.map(async (doc) => doc.delete(transaction.transaction)));

			await ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, items, this.config.uniqueKeys, transaction);
			return items;
		}));

		if (toReturn.length !== 0 && toReturn.length % limit === 0)
			await this.delete(deleteQuery, toReturn);

		return toReturn;
	}

	async querySync(syncQuery: FirestoreQuery<DBType>): Promise<Response_DBSync<DBType>> {
		return this.runInTransaction(async transaction => {
			const items = await transaction.query(this.collection, syncQuery);
			const deletedItems = await ModuleBE_SyncManager.queryDeleted(this.config.collectionName, syncQuery as FirestoreQuery<DB_Object>, transaction);

			await this.upgradeInstances(items);
			return {toUpdate: items, toDelete: deletedItems};
		});
	}

	deleteAll() {
		return this.delete({where: {}});
	}

	/*
	 * TO BE MOVED ABOVE THIS COMMENT
	 *
	 *
	 *  -- Everything under this comment should be revised and move up --
	 *
	 *
	 * TO BE MOVED ABOVE THIS COMMENT
	 */

	private async assertExternalQueryUnique(instance: DBType, transaction: FirestoreTransaction): Promise<DBType> {
		const dbInstance: DBType | undefined = await transaction.queryItem(this.collection, instance);
		if (!dbInstance) {
			const uniqueQuery = FirestoreInterface.buildUniqueQuery(this.collection, instance);
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique query '${__stringify(uniqueQuery)}'`);
		}

		return dbInstance;
	}

	/**
	 * Asserts the uniqueness of an instance in two steps:
	 * - Executes `this.preUpsertProcessing`.
	 * - Asserts uniqueness based on the internal filters.
	 *
	 * @param transaction - The transaction object.
	 * @param instance - The document for which the uniqueness assertion will occur.
	 */
	public async assertUniqueness(transaction: FirestoreTransaction, instance: DBType, request?: ExpressRequest) {
		const uniqueQueries = this.internalFilter(instance);
		if (uniqueQueries.length === 0)
			return;

		const dbInstances: (DBType | undefined)[] = await Promise.all(uniqueQueries.map(uniqueQuery => {
			return transaction.queryUnique(this.collection, {where: uniqueQuery});
		}));

		for (const idx in dbInstances) {
			const dbInstance = dbInstances[idx];
			// this.logInfo(`keys: ${__stringify(this.config.uniqueKeys)}`)
			// this.logInfo(`pre instance: ${__stringify(dbInstance)}`)
			// this.logInfo(`new instance: ${__stringify(instance)}`)
			if (!dbInstance || !this.config.uniqueKeys.find((key: keyof DBType) => dbInstance[key] !== instance[key]))
				continue;

			const query = uniqueQueries[idx];
			const message = _keys(query).reduce((carry, key) => {
				return carry + '\n' + `${String(key)}: ${query[key]}`;
			}, `${this.config.itemName} uniqueness violation. There is already a document with`);

			this.logWarning(message);
			throw new ApiException(422, message);
		}
	}

	/**
	 * Runs the module's validator for the instance.
	 *
	 * @param instance - The object to be validated.
	 *
	 * @throws `ApiException` for bad implementation or invalid input.
	 */
	public async validateImpl(instance: DBType) {
		try {
			await tsValidate(instance, this.validator);
		} catch (e: any) {
			this.logError(`error validating id: ${instance._id}`);
			this.onValidationError(e);
		}
	}

	protected onValidationError(e: Error) {
		const badImplementation = isErrorOfType(e, BadImplementationException);
		if (badImplementation)
			throw new ApiException(500, badImplementation.message);

		const error = isErrorOfType(e, ValidationException);
		if (error) {
			// TODO fix after resolving the error handling
			const errorBody = {type: 'bad-input', body: {path: error.path, input: error.input}};
			throw new ApiException(400, error.message).setErrorBody(errorBody as any);
		}
	}

	/**
	 * Override this method to return a list of "where" queries that dictate uniqueness inside the collection.
	 * Example return value: [{attribute1: item.attribute1, attribute2: item.attribute2}].
	 *
	 * @param item - The DB entry that will be used.
	 */
	protected internalFilter(item: DBType): Clause_Where<DBType>[] {
		return [];
	}

	private async _preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest) {
		await this.upgradeInstances([dbInstance]);
		await this.preUpsertProcessing(transaction, dbInstance, request);
	}

	protected async upgradeInstances(dbInstances: DBType[]) {
		await Promise.all(dbInstances.map(async dbInstance => {
			const instanceVersion = dbInstance._v;
			const currentVersion = this.config.versions[0];

			if (instanceVersion !== undefined && instanceVersion !== currentVersion)
				try {
					await this.upgradeInstance(dbInstance, currentVersion);
				} catch (e: any) {
					throw new ApiException(500, `Error while upgrading db item "${this.config.itemName}"(${dbInstance._id}): ${instanceVersion} => ${currentVersion}`, e.message);
				}
			dbInstance._v = currentVersion;
		}));
	}

	protected async upgradeInstance(dbInstance: DBType, toVersion: string): Promise<void> {
	}

	/**
	 * Override this method to customize the assertions that should be done before the insertion of the document to the DB.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 */
	protected async preUpsertProcessing(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest) {
	}

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 *
	 * Currently executed only before `deleteUnique()`.
	 *
	 * @param transaction - The transaction object
	 * @param dbInstance - The DB entry that is going to be deleted.
	 */
	protected async canDeleteDocument(transaction: FirestoreTransaction, dbInstance: DBType[]) {
		const results = flatArray<string>(await this.defaultDispatcher?.dispatchModuleAsync(dbInstance) || []);
		if (results.length)
			throw new ApiException(409, results.join('\n'));
	}

	/**
	 * A wrapper of the collections's `runInTransaction`.
	 *
	 * @param processor - The transaction's processor.
	 *
	 * @returns
	 * A promise of the result of the `processor`.
	 */
	async runInTransaction<ReturnType>(processor: (transaction: FirestoreTransaction) => Promise<ReturnType>): Promise<ReturnType> {
		return this.collection.runInTransaction(processor);
	}

	// @ts-ignore
	private async deleteCollection() {
		await this.collection.deleteAll();
	}

	async promoteCollection() {
		// read chunks of ${maxChunkSize} documents that are not of the latest collection version..
		// run them via upsert, which should convert/upgrade them to the latest version
		// if timeout should kick in.. run the api again and this will continue the promotion on the rest of the documents
		// TODO validate
		this.logDebug(`Promoting '${this.config.collectionName}' to version: ${this.config.versions[0]}`);
		let page = 0;
		const itemsCount = this.config.maxChunkSize || 100;
		let iteration = 0;
		while (iteration < 5) {

			try {

				const itemsToSyncQuery: FirestoreQuery<DB_Object> = {
					where: {
						_v: {$neq: this.config.versions[0]},
					},
					limit: {page, itemsCount}
				};

				const items = await this.query(itemsToSyncQuery as FirestoreQuery<DBType>);
				this.logInfo(`Page: ${page} Found: ${items.length} - first: ${items?.[0]?.__updated}   last: ${items?.[items.length - 1]?.__updated}`);
				await this.upsertAll(items);

				if (items.length < itemsCount)
					break;

				page++;
			} catch (e) {
				break;
			}

			iteration++;
		}
	}

	/**
	 * Inserts the `instance` using the `transaction` object.
	 *
	 * @param transaction - The transaction object.
	 * @param instance - The object to be inserted.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of the document that was inserted.
	 */
	// private async createImpl(transaction: FirestoreTransaction, instance: DBType, request?: ExpressRequest): Promise<DBType> {
	// 	return (await this.createImpl_Read(transaction, instance, request))()
	// };

	async createImpl_Read(transaction: FirestoreTransaction, instance: DBType, request?: ExpressRequest): Promise<() => Promise<DBType>> {
		await this._preUpsertProcessing(transaction, instance, request);
		await this.validateImpl(instance);
		await this.assertUniqueness(transaction, instance, request);
		return async () => transaction.insert(this.collection, instance);
	}

	/**
	 * Upserts the `instance` using a transaction, after validating it and asserting uniqueness.
	 *
	 * @param instance - The object to be upserted.
	 * @param transaction - OPTIONAL transaction to perform the upsert operation on
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of the document that was upserted.
	 */
	async upsert(instance: PreDB<DBType>, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		const processor = async (_transaction: FirestoreTransaction) => {
			return (await this.upsert_Read(instance, _transaction, request))();
		};

		let item: DBType;
		if (transaction)
			item = await processor(transaction);
		else
			item = await this.collection.runInTransaction(processor);

		await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
		return item;
	}

	async upsert_Read(instance: PreDB<DBType>, transaction: FirestoreTransaction, request?: ExpressRequest): Promise<() => Promise<DBType>> {
		const timestamp = currentTimeMillis();

		if (this.config.uniqueKeys[0] === '_id' && instance._id === undefined)
			return this.createImpl_Read(transaction, {...instance, _id: this.generateId(), __created: timestamp, __updated: timestamp} as unknown as DBType, request);

		return this.upsertImpl_Read(transaction, {
			...instance,
			_id: instance._id || this.generateId(),
			__created: instance.__created || timestamp,
			__updated: timestamp
		} as unknown as DBType, request);
	}

	protected generateId() {
		return generateHex(dbIdLength);
	}

	/**
	 * Upserts a set of objects. Batching is used to circumvent firestore limitations on the number of objects.
	 *
	 * @param instances - The objects to be upserted.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of an array of documents that were upserted.
	 */
	async upsertAll_Batched(instances: PreDB<DBType>[], request?: ExpressRequest): Promise<DBType[]> {
		return batchAction(instances, 500, async (chunked: PreDB<DBType>[]) => this.upsertAll(chunked, undefined, request));
	}

	/**
	 * Upserts the `dbInstances` using the `transaction` object.
	 *
	 * @param transaction - The transaction object.
	 * @param instances - The instances to update.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @throws `BadImplementationException` when the instances are more than 500.
	 *
	 * @returns
	 * A promise of the array of documents that were upserted.
	 */
	async upsertAll(instances: PreDB<DBType>[], transaction?: FirestoreTransaction, request?: ExpressRequest): Promise<DBType[]> {
		if (instances.length === 0)
			return [];

		if (instances.length > 500) {
			if (transaction)
				throw new BadImplementationException('Firestore transaction supports maximum 500 at a time');

			return this.upsertAll_Batched(instances, request);
		}

		const processor = async (_transaction: FirestoreTransaction) => {
			const writes = await Promise.all(await this.upsertAllImpl_Read(instances, _transaction, request));
			return Promise.all(writes.map(write => write()));
		};

		let itemsToRet: DBType[];
		if (transaction)
			itemsToRet = await processor(transaction);
		else
			itemsToRet = await this.collection.runInTransaction(processor);

		const latest = itemsToRet.reduce((toRet, current) => Math.max(toRet, current.__updated), itemsToRet[0].__updated);
		await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, latest);
		return itemsToRet;

	}

	protected async upsertAllImpl_Read(instances: PreDB<DBType>[], transaction: FirestoreTransaction, request?: ExpressRequest): Promise<(() => Promise<DBType>)[]> {
		const actions = [] as Promise<() => Promise<DBType>>[];

		instances.reduce((carry, instance: PreDB<DBType>) => {
			addItemToArray(carry, this.upsert_Read(instance, transaction, request));
			return carry;
		}, actions);

		return Promise.all(actions);
	}

	/**
	 * Upserts the `dbInstance` using the `transaction` transaction object.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The object to be upserted.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of the document that was upserted.
	 */
	private async upsertImpl(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest): Promise<DBType> {
		return (await this.upsertImpl_Read(transaction, dbInstance, request))();
	}

	protected async upsertImpl_Read(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest): Promise<() => Promise<DBType>> {
		await this._preUpsertProcessing(transaction, dbInstance, request);
		await this.validateImpl(dbInstance);
		await this.assertUniqueness(transaction, dbInstance, request);
		return transaction.upsert_Read(this.collection, dbInstance);
	}

	/**
	 * Queries the database for a specific document in the module's collection.
	 *
	 * @param where - The where clause to be used for querying.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @throws `ApiException` if the document is not found.
	 *
	 * @returns
	 * The DB document that was found.
	 */
	async queryUnique(where: Clause_Where<DBType>, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		let dbItem;
		if (transaction)
			dbItem = await transaction.queryUnique(this.collection, {where});
		else
			dbItem = await this.collection.queryUnique({where});

		if (!dbItem)
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique query: ${JSON.stringify(where)}`);

		await this.upgradeInstances([dbItem]);
		return dbItem;
	}

	/**
	 * Executes the specified query on the module's collection.
	 *
	 * @param query - The query to be executed.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of an array of documents.
	 */
	async query(query: FirestoreQuery<DBType>, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		let items;
		if (transaction)
			items = await transaction.query(this.collection, query);
		else
			items = await this.collection.query(query);

		await this.upgradeInstances(items);
		return items;
	}

	/**
	 * If propsToPatch is not set, we remove the lock keys from the caller's instance
	 * before merging with the original dbInstance.
	 * If propsToPatch is set, we also remove all of the instance's keys that
	 * are not specified in propsToPatch.
	 *
	 * @param instance - The instance to be upserted.
	 * @param propsToPatch - Properties to patch.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of the patched document.
	 */
	async patch(instance: IndexKeys<DBType, Ks> & Partial<DBType>, propsToPatch?: (keyof DBType)[], request?: ExpressRequest): Promise<DBType> {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstance: DBType = await this.assertExternalQueryUnique(instance as DBType, transaction);
			// If the caller has specified props to be changed, make sure the don't conflict with the lockKeys.
			const wrongKey = propsToPatch?.find(prop => this.config.lockKeys.includes(prop));
			if (wrongKey)
				throw new BadImplementationException(`Key ${String(wrongKey)} is part of the 'lockKeys' and cannot be updated.`);

			// If the caller has not specified props, we remove the keys from the caller's instance
			// before merging with the original dbInstance.
			_keys(instance).forEach(key => {
				if (this.config.lockKeys.includes(key) || (propsToPatch && !propsToPatch.includes(key))) {
					delete instance[key];
				}
			});

			const mergedObject = merge(dbInstance, instance);
			mergedObject.__created = mergedObject.__created || currentTimeMillis();
			mergedObject.__updated = currentTimeMillis();

			await this.assertUniqueness(transaction, mergedObject, request);

			const item = await this.upsertImpl(transaction, mergedObject, request);
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
			return item;
		});
	}
}
