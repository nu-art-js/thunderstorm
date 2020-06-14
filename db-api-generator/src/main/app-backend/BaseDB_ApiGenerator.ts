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

	protected setExternalUniqueKeys(keys: FilterKeys<DBType>) {
		if (this.initiated)
			throw new BadImplementationException("You can only update the 'externalUniqueKeys' before the module was initialized.. preferably from its constructor");

		return this.config.externalFilterKeys = keys;
	}

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

	protected internalFilter(item: DBType): Clause_Where<DBType>[] {
		return [];
	}

	protected async assertCustomUniqueness(transaction: FirestoreTransaction, dbInstance: DBType) {
	}

	protected async assertDeletion(transaction: FirestoreTransaction, dbInstance: DBType) {
	}

	async runInTransaction<ReturnType>(processor: (transaction: FirestoreTransaction) => Promise<ReturnType>): Promise<ReturnType> {
		return this.collection.runInTransaction(processor);
	}

	// @ts-ignore
	private async deleteCollection() {
		await this.collection.deleteAll();
	}

	async insertImpl(transaction: FirestoreTransaction, instance: UType) {
		return transaction.insert(this.collection, {...instance, _id: generateHex(idLength)} as unknown as DBType);
	}

	async upsert(instance: UType) {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstance: DBType = {...instance, _id: instance._id || generateHex(idLength)} as unknown as DBType;
			await this.validateImpl(dbInstance);
			await this.assertUniqueness(transaction, dbInstance);
			return this.upsertImpl(transaction, dbInstance);
		});
	}

	async upsertAll(instances: UType[]): Promise<DBType[]> {
		const writes: DBType[] = [];
		await batchAction(instances, 500, async chunked => {
			addAllItemToArray(writes, await this.upsertAllBatched(chunked));
		});
		return writes;
	}

	async upsertAllBatched(instances: UType[]): Promise<DBType[]> {
		return this.collection.runInTransaction(async (transaction) => {
			const dbInstances: DBType[] = instances.map(instance => ({...instance, _id: instance._id || generateHex(idLength)} as unknown as DBType));
			await Promise.all(dbInstances.map(async dbInstance => this.validateImpl(dbInstance)));
			await Promise.all(dbInstances.map(async dbInstance => this.assertUniqueness(transaction, dbInstance)));

			return this.upsertAllImpl(transaction, dbInstances);
		});
	}

	protected async upsertImpl(transaction: FirestoreTransaction, dbInstance: DBType): Promise<DBType> {
		return transaction.upsert(this.collection, dbInstance);
	}

	protected async upsertAllImpl(transaction: FirestoreTransaction, dbInstances: DBType[]): Promise<DBType[]> {
		return transaction.upsertAll(this.collection, dbInstances);
	}

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

	protected async deleteImpl(transaction: FirestoreTransaction, ourQuery: { where: Clause_Where<DBType> }) {
		await transaction.deleteUnique(this.collection, ourQuery);
	}

	async delete(query: FirestoreQuery<DBType>) {
		return this.collection.delete(query);
	}

	async queryUnique(where: Clause_Where<DBType>) {
		const dbItem = await this.collection.queryUnique({where});
		if (!dbItem)
			throw new ApiException(404, `Could not find ${this.config.itemName} with unique query: ${JSON.stringify(where)}`);

		return dbItem;
	}

	async query(query: FirestoreQuery<DBType>) {
		return await this.collection.query(query);
	}

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
