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

import {Clause_Where, DB_EntityDependency, FilterKeys, FirestoreQuery,} from '@nu-art/firebase';
import {
	__stringify,
	_keys,
	_values,
	addItemToArray, ApiException,
	BadImplementationException,
	batchAction,
	currentTimeMillis,
	Day,
	DB_Object,
	DBDef,
	dbIdLength,
	exists,
	filterInstances,
	generateHex,
	InvalidResult,
	merge,
	Module,
	PreDB,
	tsValidateResult,
	ValidatorTypeResolver
} from '@nu-art/ts-common';

import {IndexKeys} from '@nu-art/thunderstorm';
import {OnFirestoreBackupSchedulerAct} from '@nu-art/thunderstorm/backend';
import {
	DocWrapper,
	FirestoreCollection,
	FirestoreInterface,
	FirestoreTransaction,
	FirestoreType_DocumentSnapshot,
	ModuleBE_Firebase,
} from '@nu-art/firebase/backend';
import {canDeleteDispatcher, DBApiBEConfig, getModuleBEConfig} from './db-def';
import {ModuleBE_SyncManager} from './ModuleBE_SyncManager';
import {_EmptyQuery, Response_DBSync} from '../shared';
import {FirestoreBackupDetails} from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_Backup';


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
export abstract class ModuleBE_BaseDB<DBType extends DB_Object, ConfigType extends DBApiConfig<DBType> = DBApiConfig<DBType>, Ks extends keyof DBType = '_id'>
	extends Module<ConfigType>
	implements OnFirestoreBackupSchedulerAct {
	private static DeleteHardLimit = 250;

	public collection!: FirestoreCollection<DBType>;
	private readonly validator: ValidatorTypeResolver<DBType>;
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

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = ModuleBE_Firebase.createAdminSession(this.config?.projectId).getFirestore();
		this.collection = firestore.getCollection<DBType>(this.config.collectionName, this.config.uniqueKeys as FilterKeys<DBType>);
	}

	createFirebaseRef<T>(_relativePath: string) {
		let relativePath = _relativePath;
		if (relativePath.startsWith('/'))
			relativePath = relativePath.substring(1);

		const path = `/state/${this.getName()}/${relativePath}`;
		return ModuleBE_Firebase.createAdminSession(this.config?.projectId).getDatabase().ref<T>(path);
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
		return _EmptyQuery;
	}

	/**
	 * Deletes a unique document based on its `_id`. Uses a transaction, after deletion assertions occur.
	 *
	 * @param _id - The _id of the object to be deleted.
	 *
	 * @throws `ApiException` when the document doesn't exist in the collection.
	 *
	 * @returns
	 * A promise of the document that was deleted.
	 */
	async deleteUnique(_id: string): Promise<DBType> {
		return this.runInTransaction(async transaction => {
			return this._deleteUnique.write(transaction, await this._deleteUnique.read(transaction, _id));
		});
	}

	readonly _deleteUnique = Object.freeze({
		read: async (transaction: FirestoreTransaction, _id: string) => {
			if (!_id)
				throw new ApiException(400, 'Cannot delete without id');

			const doc = await transaction.newQueryUnique(this.collection, {where: {_id} as Clause_Where<DBType>});
			if (!doc)
				throw new ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);

			return doc;
		},
		write: async (transaction: FirestoreTransaction, doc: DocWrapper<DBType>) => {
			await this.canDeleteDocument(transaction, [doc.get()]);
			const item = await doc.delete(transaction.transaction);
			await ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, [item], this.config.uniqueKeys, transaction);
			return item;
		}
	});

	readonly _deleteMulti = Object.freeze({
		read: async (transaction: FirestoreTransaction, deleteQuery: FirestoreQuery<DBType>) => {
			if (!deleteQuery.where)
				throw new ApiException(400, 'Cannot delete without where clause!');

			if (_values(deleteQuery.where).some(value => !exists(value)))
				throw new ApiException(400, `Cannot delete due to where clause missing values! '${__stringify(deleteQuery)}'`);

			return await transaction.newQuery(this.collection,
				{...deleteQuery, limit: deleteQuery.limit || ModuleBE_BaseDB.DeleteHardLimit});
		},

		write: async (transaction: FirestoreTransaction, docs: DocWrapper<DBType>[]) => {
			const items = docs.map(doc => doc.get());
			await this.canDeleteDocument(transaction, items);

			await Promise.all(docs.map(async (doc) => doc.delete(transaction.transaction)));
			await ModuleBE_SyncManager.onItemsDeleted(this.config.collectionName, items, this.config.uniqueKeys, transaction);
			const now = currentTimeMillis();
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, now);
			return items;
		}
	});

// THIS IS WIP - NOT GOOD YET
	readonly _upsertUnique = Object.freeze({
		read: async (transaction: FirestoreTransaction, instance: PreDB<DBType>) => {
			this.assertObject(instance);

			let dbInstance: DBType;
			let where;
			if (instance._id) {
				where = {_id: instance._id!} as Clause_Where<DBType>;
			} else if ((this.config.uniqueKeys.length > 1 || this.config.uniqueKeys[0] !== '_id') && this.config.uniqueKeys.every(
				key => exists(instance[key]))) {
				where = this.config.uniqueKeys.reduce((_where, key) => {
					// @ts-ignore
					_where[key] = instance[key];
					return _where;
				}, {} as Clause_Where<DBType>);
			}

			if (where) {
				const doc = (await transaction.newQueryUnique(this.collection, {where} as FirestoreQuery<DBType>));
				if (doc)
					return doc;
			}

			const timestamp = currentTimeMillis();
			// PLEASE DO NOT MESS WITH THE UNDER CONDITION!!
			if (this.config.uniqueKeys[0] === '_id' && instance._id === undefined)
				dbInstance = {
					...instance,
					_id: this.generateId(),
					__created: timestamp,
					__updated: timestamp
				} as unknown as DBType;
			else
				dbInstance = {
					...instance,
					_id: instance._id || this.generateId(),
					__created: instance.__created || timestamp,
					__updated: timestamp
				} as unknown as DBType;

			const ref = this.collection.createDocumentReference(dbInstance._id);
			return new DocWrapper<DBType>(this.collection.wrapper,
				{ref, data: () => dbInstance} as FirestoreType_DocumentSnapshot<DBType>);
		},
		assert: async ( transaction: FirestoreTransaction, doc: DocWrapper<DBType>) => {
			const dbInstance = doc.get();
			await this._preUpsertProcessing(dbInstance, transaction);
			this.validateImpl(dbInstance);
			await this.assertUniqueness(dbInstance, transaction);

		},
		write: async (transaction: FirestoreTransaction, doc: DocWrapper<DBType>) => {
			const instance = doc.get();
			doc.set(instance, transaction.transaction);
			return instance;
		}
	});

	protected assertObject(instance: any) {
		if (Array.isArray(instance) || typeof instance !== 'object')
			throw new ApiException(400, `Trying to upsert a ${typeof instance}!`);
	}

	/**
	 * Calls the `delete` method of the module's collection.
	 *
	 * @param deleteQuery - The query to be executed for the deletion.
	 * @param toReturn
	 * @param mem - http call mem cache.
	 *
	 */
	async delete(deleteQuery: FirestoreQuery<DBType>, toReturn: DBType[] = []) {
		const start = currentTimeMillis();

		toReturn.push(...await this.runInTransaction(async transaction => {
			return this._deleteMulti.write(transaction, await this._deleteMulti.read(transaction, deleteQuery));
		}));

		if (toReturn.length !== 0 && toReturn.length % ModuleBE_BaseDB.DeleteHardLimit === 0)
			await this.delete(deleteQuery, toReturn);

		await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, start);
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
		return this.delete(_EmptyQuery);
	}

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 *
	 * Currently, executed only before `deleteUnique()`.
	 *
	 * @param transaction - The transaction object
	 * @param mem - http call mem cache.
	 * @param dbInstances - The DB entry that is going to be deleted.
	 */
	protected async canDeleteDocument(transaction: FirestoreTransaction, dbInstances: DBType[]) {
		const dependencies = await this.collectDependencies(dbInstances, transaction);
		if (dependencies)
			throw new ApiException<DB_EntityDependency<any>[]>(422, 'entity has dependencies').setErrorBody({
				type: 'has-dependencies',
				body: dependencies
			});
	}

	async collectDependencies(dbInstances: DBType[], transaction?: FirestoreTransaction) {
		const potentialErrors = await canDeleteDispatcher.dispatchModuleAsync(this.dbDef.entityName, dbInstances, transaction);
		const dependencies = filterInstances(potentialErrors.map(item => (item?.conflictingIds.length || 0) === 0 ? undefined : item));
		return dependencies.length > 0 ? dependencies : undefined;
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
	 * @param instance - The document for which the uniqueness assertion will occur.
	 * @param mem - http call mem cache.
	 * @param transaction - The transaction object.
	 */
	public async assertUniqueness(instance: DBType, transaction?: FirestoreTransaction) {
		const uniqueQueries = this.internalFilter(instance);
		if (uniqueQueries.length === 0)
			return;

		const dbInstances: (DBType | undefined)[] = await Promise.all(uniqueQueries.map(uniqueQuery => {
			if (transaction)
				return transaction.queryUnique(this.collection, {where: uniqueQuery, limit: 1});

			return this.collection.queryUnique({where: uniqueQuery});
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
	public validateImpl(instance: DBType) {
		const results = tsValidateResult(instance, this.validator);
		if (results) {
			this.onValidationError(instance, results);
		}
	}

	protected onValidationError(instance: DBType, results: InvalidResult<DBType>) {
		this.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		const errorBody = {type: 'bad-input', body: {result: results, input: instance}};
		throw new ApiException(400, `error validating ${this.dbDef.entityName}`).setErrorBody(errorBody as any);
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

	private async _preUpsertProcessing(dbInstance: DBType, transaction?: FirestoreTransaction) {
		await this.upgradeInstances([dbInstance]);
		await this.preUpsertProcessing(dbInstance, transaction);
	}

	async upgradeInstances(dbInstances: DBType[]) {
		await Promise.all(dbInstances.map(async dbInstance => {
			const instanceVersion = dbInstance._v;
			const currentVersion = this.config.versions[0];

			if (instanceVersion !== undefined && instanceVersion !== currentVersion)
				try {
					await this.upgradeInstance(dbInstance, currentVersion);
				} catch (e: any) {
					throw new ApiException(500, `Error while upgrading db item "${this.config.itemName}"(${dbInstance._id}): ${instanceVersion} => ${currentVersion}`,
						e.message);
				}
			dbInstance._v = currentVersion;
		}));
	}

	protected async upgradeInstance(dbInstance: DBType, toVersion: string): Promise<void> {
	}

	/**
	 * Override this method to customize the assertions that should be done before the insertion of the document to the DB.
	 *
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 * @param mem - http call mem cache.
	 * @param transaction - The transaction object.
	 */
	protected async preUpsertProcessing(dbInstance: DBType, transaction?: FirestoreTransaction) {
	}

	/**
	 * A wrapper of the collections' `runInTransaction`.
	 *
	 * @param processor - The transaction's processor.
	 *
	 * @returns
	 * A promise of the result of the `processor`.
	 */
	runInTransaction = async <ReturnType>(processor: (transaction: FirestoreTransaction) => Promise<ReturnType>): Promise<ReturnType> => this.collection.runInTransaction(
		processor);

	// @ts-ignore
	private async deleteCollection() {
		await this.collection.deleteAll();
	}

	/**
	 * Inserts the `instance` using the `transaction` object.
	 *
	 * @param transaction - The transaction object.
	 * @param mem - http call mem cache.
	 * @param instance - The object to be inserted.
	 *
	 * @returns
	 * A promise of the document that was inserted.
	 */
	// private async createImpl(transaction: FirestoreTransaction, instance: DBType): Promise<DBType> {
	// 	return (await this.createImpl_Read(transaction, instance))()
	// };

	async createImpl_Read(transaction: FirestoreTransaction, instance: DBType): Promise<() => Promise<DBType>> {
		await this.assertInstance(instance, transaction);
		return async () => transaction.insert(this.collection, instance, instance._id);
	}

	/**
	 * Upserts the `instance` using a transaction, after validating it and asserting uniqueness.
	 *
	 * @param instance - The object to be upserted.
	 * @param mem - http call mem cache.
	 * @param transaction - OPTIONAL transaction to perform the upsert operation on
	 *
	 * @returns
	 * A promise of the document that was upserted.
	 */
	async upsert(instance: PreDB<DBType>, transaction?: FirestoreTransaction) {
		const processor = async (_transaction: FirestoreTransaction) => {
			return (await this.upsert_Read(instance, _transaction))();
		};

		let item: DBType;
		if (transaction)
			item = await processor(transaction);
		else
			item = await this.collection.runInTransaction(processor);

		await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
		return item;
	}

	async insert(instance: PreDB<DBType>) {

		const timestamp = currentTimeMillis();
		const toInsert = {
			...instance,
			_id: this.generateId(),
			__created: timestamp,
			__updated: timestamp
		} as unknown as DBType;
		await this.assertInstance(toInsert);

		return this.collection.insert(toInsert, toInsert._id);
	}

	async insertAll(instances: PreDB<DBType>[]) {
		return Promise.all(instances.map((instance) => this.insert(instance)));
	}

	async upsert_Read(instance: PreDB<DBType>, transaction: FirestoreTransaction): Promise<() => Promise<DBType>> {
		const timestamp = currentTimeMillis();

		if (this.config.uniqueKeys[0] === '_id' && instance._id === undefined)
			return this.createImpl_Read(transaction, {
				...instance,
				_id: this.generateId(),
				__created: timestamp,
				__updated: timestamp
			} as unknown as DBType);

		return this.upsertImpl_Read(transaction, {
			...instance,
			_id: instance._id || this.generateId(),
			__created: instance.__created || timestamp,
			__updated: timestamp
		} as unknown as DBType);
	}

	protected generateId() {
		return generateHex(dbIdLength);
	}

	/**
	 * Upserts a set of objects. Batching is used to circumvent firestore limitations on the number of objects.
	 *
	 * @param instances - The objects to be upserted.
	 * @param mem - http call mem cache.
	 *
	 * @returns
	 * A promise of an array of documents that were upserted.
	 */
	async upsertAll_Batched(instances: PreDB<DBType>[]): Promise<DBType[]> {
		return batchAction(instances, 500, async (chunked: PreDB<DBType>[]) => this.upsertAll(chunked));
	}

	/**
	 * Upserts the `dbInstances` using the `transaction` object.
	 *
	 * @param instances - The instances to update.
	 * @param mem - http call mem cache.
	 * @param transaction - The transaction object.
	 *
	 * @throws `BadImplementationException` when the instances are more than 500.
	 *
	 * @returns
	 * A promise of the array of documents that were upserted.
	 */
	async upsertAll(instances: PreDB<DBType>[], transaction?: FirestoreTransaction): Promise<DBType[]> {
		if (instances.length === 0)
			return [];

		if (instances.length > 500) {
			if (transaction)
				throw new BadImplementationException('Firestore transaction supports maximum 500 at a time');

			return this.upsertAll_Batched(instances);
		}

		const processor = async (_transaction: FirestoreTransaction) => {
			const writes = await Promise.all(await this.upsertAllImpl_Read(instances, _transaction));
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

	protected async upsertAllImpl_Read(instances: PreDB<DBType>[], transaction: FirestoreTransaction): Promise<(() => Promise<DBType>)[]> {
		const actions = [] as Promise<() => Promise<DBType>>[];

		instances.reduce((carry, instance: PreDB<DBType>) => {
			addItemToArray(carry, this.upsert_Read(instance, transaction));
			return carry;
		}, actions);

		return Promise.all(actions);
	}

	/**
	 * Upserts the `dbInstance` using the `transaction` transaction object.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The object to be upserted.
	 * @param mem - http call mem cache.
	 *
	 * @returns
	 * A promise of the document that was upserted.
	 */
	private async upsertImpl(transaction: FirestoreTransaction, dbInstance: DBType): Promise<DBType> {
		return (await this.upsertImpl_Read(transaction, dbInstance))();
	}

	protected async upsertImpl_Read(transaction: FirestoreTransaction, dbInstance: DBType): Promise<() => Promise<DBType>> {
		await this.assertInstance(dbInstance, transaction);
		return transaction.upsert_Read(this.collection, dbInstance, dbInstance._id);
	}

	private async assertInstance(dbInstance: DBType, transaction?: FirestoreTransaction) {
		await this._preUpsertProcessing(dbInstance, transaction);
		this.validateImpl(dbInstance);
		await this.assertUniqueness(dbInstance, transaction);
	}

	/**
	 * Queries the database for a specific document in the module's collection.
	 *
	 * @param where - The where clause to be used for querying.
	 * @param transaction
	 * @param mem
	 *
	 * @throws `ApiException` if the document is not found.
	 *
	 * @returns
	 * The DB document that was found.
	 */
	async queryUnique(where: Clause_Where<DBType>, transaction?: FirestoreTransaction) {
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
	 * @param mem - http call mem cache.
	 * @param transaction
	 *
	 * @returns
	 * A promise of an array of documents.
	 */
	async query(query: FirestoreQuery<DBType>, transaction?: FirestoreTransaction) {
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
	 * @param mem - http call mem cache.
	 * @param propsToPatch - Properties to patch.
	 *
	 * @returns
	 * A promise of the patched document.
	 */
	async patch(instance: IndexKeys<DBType, Ks> & Partial<DBType>, propsToPatch?: (keyof DBType)[]): Promise<DBType> {
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

			await this.assertUniqueness(mergedObject, transaction);

			const item = await this.upsertImpl(transaction, mergedObject);
			await ModuleBE_SyncManager.setLastUpdated(this.config.collectionName, item.__updated);
			return item;
		});
	}
}