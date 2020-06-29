/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
	Clause_Where,
	DB_Object,
	FilterKeys,
	FirestoreQuery,
} from "@nu-art/firebase";
import {
	__stringify,
	_keys,
	addAllItemToArray,
	BadImplementationException,
	batchAction,
	filterDuplicates,
	filterInstances,
	generateHex,
	isErrorOfType,
	merge,
	Module,
	PartialProperties,
	validate,
	validateRegexp,
	ValidationException,
	ValidatorTypeResolver
} from "@nu-art/ts-common";
import {
	ServerApi_Create,
	ServerApi_Delete,
	ServerApi_Query,
	ServerApi_Unique,
	ServerApi_Update
} from "./apis";
import {
	ApiException,
	ExpressRequest,
	ServerApi
} from "@nu-art/thunderstorm/backend";
import {
	FirebaseModule,
	FirestoreCollection,
	FirestoreInterface,
	FirestoreTransaction,
} from "@nu-art/firebase/backend";
import {
	BadInputErrorBody,
	ErrorKey_BadInput
} from "../index";

const idLength = 32;
export const validateId = (length: number, mandatory: boolean = true) => validateRegexp(new RegExp(`^[0-9a-f]{${length}}$`), mandatory);
export const validateUniqueId = validateId(idLength);
export const validateOptionalId = validateId(idLength, false);
export const validateStringWithDashes = validateRegexp(/^[A-Za-z-]+$/);
export const validateNameWithDashesAndDots = validateRegexp(/^[a-z-.]+$/);


export type CustomUniquenessAssertion<Type extends DB_Object> = (transaction: FirestoreTransaction, dbInstance: Type) => Promise<void>;

export type Config<Type extends object> = {
	projectId?: string,
	lockKeys: (keyof Type)[]
	collectionName: string
	itemName: string
	externalFilterKeys: FilterKeys<Type>
}

/**
 * An abstract base class used for implementing CRUD operations on a specific collection.
 *
 * By default, it exposes API endpoints for creating, deleting, updating, querying and querying for unique document.
 */
export abstract class BaseDB_ApiGenerator<DBType extends DB_Object, ConfigType extends Config<DBType> = Config<DBType>, UType extends PartialProperties<DBType, "_id"> = PartialProperties<DBType, "_id">>
	extends Module<ConfigType> {

	public readonly collection!: FirestoreCollection<DBType>;
	private validator: ValidatorTypeResolver<DBType>;

	protected constructor(collectionName: string, validator: ValidatorTypeResolver<DBType>, itemName: string) {
		super();
		// @ts-ignore
		this.setDefaultConfig({itemName, collectionName, externalFilterKeys: ["_id"], lockKeys: ["_id"]});
		this.validator = validator;
	}

	setValidator(validator: ValidatorTypeResolver<DBType>) {
		this.validator = validator;
	}

	// this.setExternalUniqueKeys(["accessLevelIds"]);

	/**
	 * Sets the external unique keys. External keys are the attributes of a document that must be unique inside the
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
			throw new BadImplementationException("You can only update the 'externalUniqueKeys' before the module was initialized.. preferably from its constructor");

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
			throw new BadImplementationException("You can only update the 'lockKeys' before the module was initialized.. preferably from its constructor");

		return this.config.lockKeys = filterDuplicates([...keys,
		                                                "_id"]);
	}

	getCollectionName() {
		return this.config.collectionName;
	}

	getItemName() {
		return this.config.itemName;
	}

	/**
	 * Executed during the initialization of the module.
	 * The collection reference is set in this method.
	 */
	init() {
		const firestore = FirebaseModule.createAdminSession(this.config?.projectId).getFirestore();
		// @ts-ignore
		this["collection"] = firestore.getCollection<DBType>(this.config.collectionName, this.config.externalFilterKeys);
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
	 * - Executes `this.assertCustomUniqueness`.
	 * - Asserts uniqueness based on the internal filters.
	 *
	 * @param transaction - The transaction object.
	 * @param instance - The document for which the uniqueness assertion will occur.
	 */
	public async assertUniqueness(transaction: FirestoreTransaction, instance: DBType) {
		await this.assertCustomUniqueness(transaction, instance);

		const uniqueQueries = this.internalFilter(instance);
		if (uniqueQueries.length === 0)
			return;

		const dbInstances: (DBType | undefined)[] = await Promise.all(uniqueQueries.map(uniqueQuery => {
			return transaction.queryUnique(this.collection, {where: uniqueQuery});
		}));

		for (const dbInstance of dbInstances) {
			if (!dbInstance)
				continue;

			if (dbInstance._id !== instance._id)
				throw new ApiException(422, `${this.config.itemName} uniqueness violation`);
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
			await validate(instance, this.validator);
		} catch (e) {

			const badImplementation = isErrorOfType(e, BadImplementationException);
			if (badImplementation)
				throw new ApiException(500, badImplementation.message);

			const error = isErrorOfType(e, ValidationException);
			if (error) {
				const errorBody = {type: ErrorKey_BadInput, body: {path: error.path, input: error.input}};
				throw new ApiException<BadInputErrorBody>(400, error.message).setErrorBody(errorBody)
			}
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

	/**
	 * Override this method to customize the assertions that should be done before the insertion of the document to the DB.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The DB entry for which the uniqueness is being asserted.
	 */
	protected async assertCustomUniqueness(transaction: FirestoreTransaction, dbInstance: DBType) {
	}

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 *
	 * Currently executed only before `deleteUnique()`.
	 *
	 * @param transaction - The transaction object
	 * @param dbInstance - The DB entry that is going to be deleted.
	 */
	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DBType) {
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
	async createImpl(transaction: FirestoreTransaction, instance: DBType, request?: ExpressRequest) {
		await this.validateImpl(instance);
		await this.assertUniqueness(transaction, instance);
		return transaction.insert(this.collection, instance);
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
	async upsert(instance: UType, transaction?: FirestoreTransaction, request?: ExpressRequest) {
		const processor = async (_transaction: FirestoreTransaction) => {
			let toProcess;
			let dbInstance: DBType;
			if (instance._id === undefined) {
				toProcess = this.createImpl;
				dbInstance = {...instance, _id: generateHex(idLength)} as unknown as DBType;
			} else {
				toProcess = this.upsertImpl;
				dbInstance = instance as unknown as DBType;
			}

			return toProcess(_transaction, dbInstance, request);
		};

		if (transaction)
			return processor(transaction);

		return this.collection.runInTransaction(processor);
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
	async upsertAll(instances: UType[], request?: ExpressRequest): Promise<DBType[]> {
		const toReturn: DBType[] = [];
		await batchAction(instances, 500, async (chunked: UType[]) => {
			addAllItemToArray(toReturn, await this.upsertAllBatched(chunked, request));
		});
		return toReturn;
	}

	private async upsertAllBatched(instances: UType[], request?: ExpressRequest, transaction?: FirestoreTransaction): Promise<DBType[]> {
		const processor = async (_transaction: FirestoreTransaction) => {
			const dbInstances: DBType[] = instances.map(instance => ({...instance, _id: instance._id || generateHex(idLength)} as unknown as DBType));

			return this.upsertAllImpl(_transaction, dbInstances, request);
		};

		if(transaction)
			return processor(transaction)

		return this.collection.runInTransaction(processor);
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
	protected async upsertImpl(transaction: FirestoreTransaction, dbInstance: DBType, request?: ExpressRequest): Promise<DBType> {
		await this.validateImpl(dbInstance);
		await this.assertUniqueness(transaction, dbInstance);
		return transaction.upsert(this.collection, dbInstance);
	}

	/**
	 * Upserts the `dbInstances` using the `transaction` object.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstances - The instances to update.
	 * @param request - The request in order to possibly obtain more info.
	 *
	 * @throws `BadImplementationException` when the instances are more than 500.
	 *
	 * @returns
	 * A promise of the array of documents that were upserted.
	 */
	protected async upsertAllImpl(transaction: FirestoreTransaction, dbInstances: DBType[], request?: ExpressRequest): Promise<DBType[]> {

		await Promise.all(dbInstances.map(async dbInstance => this.validateImpl(dbInstance)));
		await Promise.all(dbInstances.map(async dbInstance => this.assertUniqueness(transaction, dbInstance)));

		return transaction.upsertAll(this.collection, dbInstances);
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
	async deleteUnique(_id: string, request?: ExpressRequest) {
		if (!_id)
			throw new BadImplementationException(`No _id for deletion provided.`);

		return this.collection.runInTransaction(async (transaction: FirestoreTransaction) => {
			const ourQuery = {where: {_id} as Clause_Where<DBType>};
			const dbInstance = await transaction.queryUnique(this.collection, ourQuery);
			if (!dbInstance)
				throw new ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);

			await this.assertDeletion(transaction, dbInstance);
			await this.deleteImpl(transaction, ourQuery, request);
			return dbInstance;
		});
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
	private async deleteImpl(transaction: FirestoreTransaction, ourQuery: { where: Clause_Where<DBType> }, request?: ExpressRequest) {
		return transaction.deleteUnique(this.collection, ourQuery);
	}

	/**
	 * Calls the `delete` method of the module's collection.
	 *
	 * @param query - The query to be executed for the deletion.
	 * @param request - The request in order to possibly obtain more info.
	 */
	async delete(query: FirestoreQuery<DBType>, request?: ExpressRequest) {
		return this.collection.delete(query);
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
	async queryUnique(where: Clause_Where<DBType>, request?: ExpressRequest) {
		const dbItem = await this.collection.queryUnique({where});
		if (!dbItem)
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique query: ${JSON.stringify(where)}`);

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
	async query(query: FirestoreQuery<DBType>, request?: ExpressRequest) {
		return await this.collection.query(query);
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
	async patch(instance: DBType, propsToPatch?: (keyof DBType)[], request?: ExpressRequest): Promise<DBType> {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstance: DBType = await this.assertExternalQueryUnique(instance, transaction);
			// If the caller has specified props to be changed, make sure the don't conflict with the lockKeys.
			const wrongKey = propsToPatch?.find(prop => this.config.lockKeys.includes(prop));
			if (wrongKey)
				throw new BadImplementationException(`Key ${wrongKey} is part of the 'lockKeys' and cannot be updated.`);

			// If the caller has not specified props, we remove the keys from the caller's instance
			// before merging with the original dbInstance.
			_keys(instance).forEach(key => {
				if (this.config.lockKeys.includes(key) || (propsToPatch && !propsToPatch.includes(key))) {
					delete instance[key];
				}
			});

			const mergedObject = merge(dbInstance, instance);

			await validate(mergedObject, this.validator);

			await this.assertUniqueness(transaction, mergedObject);

			return this.upsertImpl(transaction, mergedObject, request);
		});
	}

	protected apiCreate(pathPart?: string): ServerApi_Create<DBType> | ServerApi<any> | undefined {
		return new ServerApi_Create(this, pathPart);
	}

	protected apiQuery(pathPart?: string): ServerApi<any> | undefined {
		return new ServerApi_Query(this, pathPart);
	}

	protected apiQueryUnique(pathPart?: string): ServerApi<any> | undefined {
		return new ServerApi_Unique(this, pathPart);
	}

	protected apiUpdate(pathPart?: string): ServerApi<any> | undefined {
		return new ServerApi_Update(this, pathPart);
	}

	protected apiDelete(pathPart?: string): ServerApi<any> | undefined {
		return new ServerApi_Delete(this, pathPart);
	}

	/**
	 * Override this method, to control which server api endpoints are created automatically.
	 *
	 * @param pathPart - The path part.
	 *
	 * @returns
	 * An array of api endpoints.
	 */
	apis(pathPart?: string): ServerApi<any>[] {
		return filterInstances(
			[
				this.apiCreate(pathPart),
				this.apiQuery(pathPart),
				this.apiQueryUnique(pathPart),
				this.apiUpdate(pathPart),
				this.apiDelete(pathPart),
			]);
	}
}
