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
	filterDuplicates,
	generateHex,
	isErrorOfType,
	merge,
	Module,
	PreDB,
	ThisShouldNotHappenException,
	tsValidate,
	ValidationException,
	ValidatorTypeResolver
} from '@nu-art/ts-common';

import {IndexKeys, QueryParams} from '@nu-art/thunderstorm';
import {
	ApiDefServer,
	ApiException,
	ApiModule,
	createBodyServerApi,
	createQueryServerApi,
	ExpressRequest,
	FirestoreBackupDetails,
	OnFirestoreBackupSchedulerAct,
	ServerApi_Middleware
} from '@nu-art/thunderstorm/backend';
import {FirebaseModule, FirestoreCollection, FirestoreInterface, FirestoreTransaction,} from '@nu-art/firebase/backend';
import {DB_Object_validator, dbIdLength} from '../shared/validators';
import {Const_LockKeys, DBApiBEConfig, getModuleBEConfig} from './db-def';
import {DBDef} from '../shared/db-def';
import {ApiStruct_DBApiGenIDB, DBApiDefGeneratorIDB} from '../shared';
import {ModuleBE_SyncManager} from './ModuleBE_SyncManager';


export type BaseDBApiConfig = {
	projectId?: string,
	maxChunkSize: number
}
export type DBApiConfig<Type extends DB_Object> = BaseDBApiConfig & DBApiBEConfig<Type>

export type ApisParams = {
	pathPart?: string,
	middleware?: ServerApi_Middleware[]
	printResponse?: boolean
	printRequest?: boolean
};

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export abstract class BaseDB_ApiGenerator<DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>
	extends Module<ConfigType>
	implements OnFirestoreBackupSchedulerAct, ApiDefServer<ApiStruct_DBApiGenIDB<DBType, Ks>>, ApiModule {

	public collection!: FirestoreCollection<DBType>;
	private validator: ValidatorTypeResolver<DBType>;

	readonly v1: ApiDefServer<ApiStruct_DBApiGenIDB<DBType, Ks>>['v1'];

	protected constructor(dbDef: DBDef<DBType, any>, appConfig?: BaseDBApiConfig) {
		super();
		const config = getModuleBEConfig(dbDef);

		const preConfig = {...config, ...appConfig};

		// @ts-ignore
		this.setDefaultConfig(preConfig);
		this.validator = config.validator;
		const apiDef = DBApiDefGeneratorIDB<DBType, Ks>(dbDef);
		this.v1 = {
			query: createBodyServerApi(apiDef.v1.query, this._query),
			sync: undefined,
			queryUnique: createQueryServerApi(apiDef.v1.queryUnique, this._queryUnique),
			upsert: createBodyServerApi(apiDef.v1.upsert, this._upsert),
			upsertAll: createBodyServerApi(apiDef.v1.upsertAll, this._upsertAll),
			patch: createBodyServerApi(apiDef.v1.patch, this._patch),
			delete: createQueryServerApi(apiDef.v1.delete, this._deleteUnique),
			deleteAll: createQueryServerApi(apiDef.v1.deleteAll, this._deleteAll),
			getDBLastUpdated: createQueryServerApi(apiDef.v1.getDBLastUpdated, this._getDBLastUpdated)
		};
	}

	useRoutes() {
		return this.v1;
	}

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = FirebaseModule.createAdminSession(this.config?.projectId).getFirestore();
		this.collection = firestore.getCollection<DBType>(this.config.collectionName, this.config.externalFilterKeys as FilterKeys<DBType>);
	}

	private _upsert = async (instance: PreDB<DBType>, request?: ExpressRequest) => this.upsert(instance, undefined, request);

	private _upsertAll = async (instances: PreDB<DBType>[], request?: ExpressRequest) => this.upsertAll(instances, undefined, request);

	private _deleteAll = async (ignore?: {}, request?: ExpressRequest) => this.deleteAll(request);

	private _patch = async (instance: IndexKeys<DBType, Ks> & Partial<DBType>, request?: ExpressRequest) => this.patch(instance, undefined, request);

	private _deleteUnique = async (id: { _id: string }, request?: ExpressRequest): Promise<DBType> => this.deleteUnique(id._id, undefined, request);

	private _query = async (query: FirestoreQuery<DBType>, request?: ExpressRequest) => this.query(query, undefined, request);

	private _queryUnique = async (where: QueryParams, request?: ExpressRequest) => this.queryUnique(where as Clause_Where<DBType>, undefined, request);

	private _getDBLastUpdated = async () => this.getDBLastUpdated();

	setValidator(validator: ValidatorTypeResolver<DBType>) {
		this.validator = validator;
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

// this.setExternalUniqueKeys(["accessLevelIds"]);

	/**
	 * Sets the external unique keys. External keys are the attributes of a documen@returnt that must be unique inside the
	 * collection. Default is `_id`.
	 *
	 * @remarks
	 * You can only update the external unique keys before the module is initialized, preferably from its constructor.
	 *
	 * @param keys - The external unique keys.
	 *
	 * @returns
	 * The external filter keys.
	 */
	protected setExternalUniqueKeys(keys: FilterKeys<DBType>) {
		if (this.initiated)
			throw new BadImplementationException('You can only update the \'externalUniqueKeys\' before the module was initialized.. preferably from its constructor');

		return this.config.externalFilterKeys = keys;
	}

	/**
	 * Sets the lock keys. Lock keys are the attributes of a document that must not be changed during a patch.
	 * Thr property `_id` is always part of the lock keys.
	 *
	 * @remarks
	 * You can only update the lock keys before the module is initialized, preferably from its constructor.
	 *
	 * @param keys - The lock keys.
	 *
	 * @returns
	 * The lock keys.
	 */
	protected setLockKeys(keys: (keyof DBType)[]) {
		if (this.initiated)
			throw new BadImplementationException('You can only update the \'lockKeys\' before the module was initialized.. preferably from its constructor');

		return this.config.lockKeys = filterDuplicates([...keys, ...Const_LockKeys]);
	}

	getCollectionName() {
		return this.config.collectionName;
	}

	getItemName() {
		return this.config.itemName;
	}

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
			// this.logInfo(`keys: ${__stringify(this.config.externalFilterKeys)}`)
			// this.logInfo(`pre instance: ${__stringify(dbInstance)}`)
			// this.logInfo(`new instance: ${__stringify(instance)}`)
			if (!dbInstance || !this.config.externalFilterKeys.find((key: keyof DBType) => dbInstance[key] !== instance[key]))
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
			await tsValidate(instance, instance.__deleted ? DB_Object_validator : this.validator);
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

	private getDBLastUpdated = async () => {
		//FIXME: change this to actual collection "lastUpdated" number
		return 0;
	};

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
	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest) {
		return (await this.assertDeletion_Read(transaction, dbInstance, request))();
	}

	protected async assertDeletion_Read(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest): Promise<() => void> {
		return async () => {
		};
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

		if (this.config.externalFilterKeys[0] === '_id' && instance._id === undefined)
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
		const item = itemsToRet.reduce<DBType | undefined>((toRet, current) => {
			if (!toRet || current.__updated > toRet.__updated)
				return current;
			return toRet;
		}, undefined);
		if (item)
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
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
	 * Deletes a unique document based on its `_id`. Uses a transaction, after deletion assertions occur.
	 *
	 * @param _id - The _id of the object to be deleted.
	 * @param transaction
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @throws `ApiException` when the document doesn't exist in the collection.
	 *
	 * @returns
	 * A promise of the document that was deleted.
	 */
	async deleteUnique(_id: string, transaction?: FirestoreTransaction, request?: ExpressRequest): Promise<DBType> {
		if (!_id)
			throw new BadImplementationException(`No _id for deletion provided.`);

		const processor = async (_transaction: FirestoreTransaction) => {
			const write = await this.deleteUnique_Read(_id, _transaction, request);
			if (!write)
				throw new ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);

			return write();
		};

		if (transaction)
			return processor(transaction);

		return this.collection.runInTransaction(processor);
	}

	async deleteUnique_Read(_id: string, transaction: FirestoreTransaction, request?: ExpressRequest): Promise<() => Promise<DBType>> {
		if (!_id)
			throw new BadImplementationException(`No _id for deletion provided.`);

		const ourQuery = {where: {_id} as Clause_Where<DBType>};
		const dbInstance = await transaction.queryUnique(this.collection, ourQuery);
		if (!dbInstance)
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);

		return await this.deleteImpl_Read(transaction, ourQuery, request);
	}

	/**
	 * Uses the `transaction` to delete a unique document, querying with the `ourQuery`.
	 *
	 * @param transaction - The transaction object.
	 * @param ourQuery - The query to be used for the deletion.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @returns
	 * A promise of the document that was deleted.
	 */
	private async deleteImpl_Read(transaction: FirestoreTransaction, ourQuery: { where: Clause_Where<DBType> }, request?: ExpressRequest): Promise<() => Promise<DBType>> {
		const item = await transaction.queryUnique(this.collection, ourQuery);
		if (!item)
			throw new ApiException(404, `no item to delete found for query: ${JSON.stringify(ourQuery)}`);

		const deletedItem = this.prepareItemToDelete(item);

		const write = await transaction.upsert_Read(this.collection, deletedItem);
		if (!write)
			throw new ThisShouldNotHappenException(`I just checked that I had an instance for query: ${__stringify(ourQuery)}`);

		return write;
	}

	private prepareItemToDelete = (item: DBType) => {
		if (item.__deleted)
			throw new ApiException(422, `item for query was already deleted: ${item._id}`);

		const {_id, __updated, __created, _v} = item;
		const deletedItem = {_id, __updated, __created, _v, __deleted: true};
		this.config.externalFilterKeys.forEach(key => {
			deletedItem[key] = item[key];
		});
		return deletedItem as DBType;
	};

	/**
	 * Calls the `delete` method of the module's collection.
	 *
	 * @param query - The query to be executed for the deletion.
	 * @param request - The request in order to possibly obtain more info.
	 */
	async delete(query: FirestoreQuery<DBType>, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		const items = await this.query(query);
		const itemsToDelete = items.reduce<DBType[]>((toRet, item) => {
			if (!item.__deleted)
				toRet.push(this.prepareItemToDelete(item));
			return toRet;
		}, []);
		if (itemsToDelete.length)
			return this.upsertAll(itemsToDelete, transaction, request);
		return itemsToDelete;
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

			await tsValidate(mergedObject, this.validator);
			await this.assertUniqueness(transaction, mergedObject, request);

			const item = await this.upsertImpl(transaction, mergedObject, request);
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
			return item;
		});
	}

	deleteAll(request?: ExpressRequest) {
		return this.delete({where: {}});
	}
}
