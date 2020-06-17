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
	addAllItemToArray,
	BadImplementationException,
	batchAction,
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
	patchKeys?: (keyof Type)[]
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
		this.setDefaultConfig({itemName, collectionName, externalFilterKeys: ["_id"]});
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
	 * Sets the patch keys. Patch keys are the attributes that are allowed to be changed in a document.
	 *
	 * @remarks
	 * You can only update the patch keys before the module is initialized, preferably from its constructor.
	 *
	 * @param keys - The patch keys.
	 *
	 * @returns
	 * The patch keys.
	 */
	protected setPatchKeys(keys: (keyof DBType)[]) {
		if (this.initiated)
			throw new BadImplementationException("You can only update the 'patchKeys' before the module was initialized.. preferably from its constructor");

		return this.config.patchKeys = keys;
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
		this.collection = firestore.getCollection<DBType>(this.config.collectionName, this.config.externalFilterKeys);
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
	 *
	 * @returns
	 * A promise of the document that was inserted.
	 */
	async insertImpl(transaction: FirestoreTransaction, instance: UType) {
		return transaction.insert(this.collection, {...instance, _id: generateHex(idLength)} as unknown as DBType);
	}

	/**
	 * Upserts the `instance` using a transaction, after validating it and asserting uniqueness.
	 *
	 * @param instance - The object to be upserted.
	 *
	 * @returns
	 * A promise of the document that was upserted.
	 */
	async upsert(instance: UType) {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstance: DBType = {...instance, _id: instance._id || generateHex(idLength)} as unknown as DBType;
			await this.validateImpl(dbInstance);
			await this.assertUniqueness(transaction, dbInstance);
			return this.upsertImpl(transaction, dbInstance);
		});
	}

	/**
	 * Upserts a set of objects. Batching is used to circumvent firestore limitations on the number of objects.
	 *
	 * @param instances - The objects to be upserted.
	 *
	 * @returns
	 * A promise of an array of documents that were upserted.
	 */
	async upsertAll(instances: UType[]): Promise<DBType[]> {
		const writes: DBType[] = [];
		await batchAction(instances, 500, async chunked => {
			addAllItemToArray(writes, await this.upsertAllBatched(chunked));
		});
		return writes;
	}

	private async upsertAllBatched(instances: UType[]): Promise<DBType[]> {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstances: DBType[] = instances.map(instance => ({...instance, _id: instance._id || generateHex(idLength)} as unknown as DBType));
			await Promise.all(dbInstances.map(async dbInstance => this.validateImpl(dbInstance)));
			await Promise.all(dbInstances.map(async dbInstance => this.assertUniqueness(transaction, dbInstance)));

			return this.upsertAllImpl(transaction, dbInstances);
		});
	}

	/**
	 * Upserts the `dbInstance` using the `transaction` transaction object.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The object to be upserted.
	 *
	 * @returns
	 * A promise of the document that was upserted.
	 */
	protected async upsertImpl(transaction: FirestoreTransaction, dbInstance: DBType): Promise<DBType> {
		return transaction.upsert(this.collection, dbInstance);
	}

	/**
	 * Upserts the `dbInstances` using the `transaction` object.
	 *
	 * @param transaction - The transaction object.
	 * @param dbInstance - The set of objects to be upserted.
	 *
	 * @throws `BadImplementationException` when the instances are more than 500.
	 *
	 * @returns
	 * A promise of the array of documents that were upserted.
	 */
	protected async upsertAllImpl(transaction: FirestoreTransaction, dbInstances: DBType[]): Promise<DBType[]> {
		return transaction.upsertAll(this.collection, dbInstances);
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
	async deleteUnique(_id: string) {
		return this.collection.runInTransaction(async (transaction: FirestoreTransaction) => {
			const ourQuery = {where: {_id} as Clause_Where<DBType>};
			const dbInstance = await transaction.queryUnique(this.collection, ourQuery);
			if (!dbInstance)
				throw new ApiException(404, `Could not find ${this.config.itemName} with unique id: ${_id}`);

			await this.assertDeletion(transaction, dbInstance);
			await this.deleteImpl(transaction, ourQuery);
			return dbInstance;
		});
	}

	/**
	 * Uses the `transaction` to delete a unique document, querying with the `ourQuery`.
	 *
	 * @param transaction - The transaction object.
	 * @param ourQuery - The query to be used for the deletion.
	 *
	 * @returns
	 * A promise of the document that was deleted.
	 */
	private async deleteImpl(transaction: FirestoreTransaction, ourQuery: { where: Clause_Where<DBType> }) {
		return transaction.deleteUnique(this.collection, ourQuery);
	}

	/**
	 * Calls the `delete` method of the module's collection.
	 *
	 * @param query - The query to be executed for the deletion.
	 */
	async delete(query: FirestoreQuery<DBType>) {
		return this.collection.delete(query);
	}

	/**
	 * Queries the database for a specific document in the module's collection.
	 *
	 * @param where - The where clause to be used for querying.
	 *
	 * @throws `ApiException` if the document is not found.
	 *
	 * @returns
	 * The DB document that was found.
	 */
	async queryUnique(where: Clause_Where<DBType>) {
		const dbItem = await this.collection.queryUnique({where});
		if (!dbItem)
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique query: ${JSON.stringify(where)}`);

		return dbItem;
	}

	/**
	 * Executes the specified query on the module's collection.
	 *
	 * @param query - The query to be executed.
	 *
	 * @returns
	 * A promise of an array of documents.
	 */
	async query(query: FirestoreQuery<DBType>) {
		return await this.collection.query(query);
	}

	/**
	 * Executes `this.upsertImpl` using an instance that is formed by the `_props` and the defined patch keys.
	 * Uses a transaction to execute the patch.
	 *
	 * @param instance - The initial instance to be upserted.
	 * @param _props - The attributes to be changed.
	 *
	 * @returns
	 * A promise of the document that was patched.
	 */
	async patch(instance: DBType, _props?: (keyof DBType)[]): Promise<DBType> {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstance: DBType = await this.assertExternalQueryUnique(instance, transaction);
			let props = _props;
			if (!props)
				props = this.config.patchKeys;

			if (props)
				props.forEach(key => dbInstance[key] = instance[key]);
			else
				merge(dbInstance, instance);

			await validate(instance, this.validator);

			await this.assertUniqueness(transaction, instance);

			return this.upsertImpl(transaction, dbInstance);
		});
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
		return [
			new ServerApi_Create(this, pathPart),
			new ServerApi_Delete(this, pathPart),
			new ServerApi_Update(this, pathPart),
			new ServerApi_Query(this, pathPart),
			new ServerApi_Unique(this, pathPart),
		];
	}
}
