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

import {
	__stringify,
	_keys,
	ApiException,
	BadImplementationException,
	batchAction,
	compare,
	currentTimeMillis,
	CustomException,
	DB_Object,
	DB_Object_validator,
	DBDef,
	DefaultDBVersion,
	exists,
	filterInOut,
	filterInstances,
	flatArray,
	generateHex,
	InvalidResult,
	KeysOfDB_Object,
	MUSTNeverHappenException,
	PreDB,
	StaticLogger,
	Subset,
	tsValidateResult,
	UniqueId,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {
	FirestoreType_Collection,
	FirestoreType_DocumentReference,
	FirestoreType_DocumentSnapshot
} from '../firestore/types';
import {Clause_Where, DB_EntityDependency, FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV2} from './FirestoreInterfaceV2';
import {firestore} from 'firebase-admin';
import {DocWrapperV2} from './DocWrapperV2';
import {canDeleteDispatcherV2} from './consts';
import DocumentReference = firestore.DocumentReference;
import UpdateData = firestore.UpdateData;
import FieldValue = firestore.FieldValue;

type UpdateObject<Type> = { _id: UniqueId } & UpdateData<Type>;
export const _EmptyQuery = Object.freeze({where: {}});
export const dbIdLength = 32;

export function generateId() {
	return generateHex(dbIdLength);
}

/**
 * # <ins>FirestoreException</ins>
 * @category Exceptions
 */
export class FirestoreException
	extends CustomException {

	constructor(message: string, cause?: Error) {
		super(FirestoreException, message, cause);
	}
}

/**
 * FirestoreCollection is a class for handling Firestore collections. It takes in the name, FirestoreWrapperBE instance, and uniqueKeys as parameters.
 */
export class FirestoreCollectionV2<Type extends DB_Object> {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBEV2;
	readonly collection: FirestoreType_Collection;
	readonly dbDef: DBDef<Type, any>;
	private readonly validator: ValidatorTypeResolver<Type>;


	/**
	 * External unique as in there must never ever be two that answer the same query
	 */
	readonly externalUniqueFilter: ((object: Subset<Type>) => Clause_Where<Type>);

	/**
	 * @param name
	 * @param wrapper
	 * @param _dbDef
	 * @param uniqueKeys
	 */
	constructor(wrapper: FirestoreWrapperBEV2, _dbDef: DBDef<Type>) {
		this.name = _dbDef.dbName;
		this.wrapper = wrapper;
		if (!/[a-z-]{3,}/.test(_dbDef.dbName))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.collection = wrapper.firestore.collection(_dbDef.dbName);
		this.externalUniqueFilter = (item: Type) => {
			if (!_dbDef.uniqueKeys)
				throw new BadImplementationException('In order to use a unique query your collection MUST have a unique filter');

			return _dbDef.uniqueKeys.reduce((where, key: keyof Type) => {
				if (!exists(item[key]))
					throw new BadImplementationException(
						`No where properties are allowed to be null or undefined.\nWhile querying collection '${this.name}' we found property '${String(key)}' to be '${where[key]}'`);

				// @ts-ignore
				where[key] = item[key];
				return where;
			}, {} as Clause_Where<Type>);
		};
		this.dbDef = _dbDef;
		this.validator = this.getValidator(_dbDef);
	}

	getValidator = (dbDef: DBDef<Type>): ValidatorTypeResolver<Type> => {
		return typeof dbDef.validator === 'function' ?
			[((instance: Type) => {
				const dbObjectOnly = KeysOfDB_Object.reduce<DB_Object>((objectToRet, key) => {
					if (exists(instance[key]))  // @ts-ignore
						objectToRet[key] = instance[key];

					return objectToRet;
				}, {} as DB_Object);
				return tsValidateResult(dbObjectOnly, DB_Object_validator);
			}), dbDef.validator] as ValidatorTypeResolver<Type> :
			{...DB_Object_validator, ...dbDef.validator} as ValidatorTypeResolver<Type>;
	};

	// ############################## DocWrapper ##############################
	getDocWrapper = (_id: UniqueId): DocWrapperV2<Type> => {
		const doc = this.wrapper.firestore.doc(`${this.name}/${_id}`) as FirestoreType_DocumentReference<Type>;
		return new DocWrapperV2<Type>(doc);
	};

	getDocWrapperFromItem = (item: PreDB<Type>): DocWrapperV2<Type> => {
		if (!exists(item._id))
			throw new BadImplementationException('Cannot create DocWrapper without _id!');

		return this.getDocWrapper(item._id!);
	};

	// ############################## Query ##############################
	protected async queryByIds(all_ids: UniqueId[], transaction?: Transaction) {

		return await batchAction(all_ids, 10, async (chunk) => {
			const myQuery = FirestoreInterfaceV2.buildQuery<Type>(this, {where: {_id: {$in: chunk}}} as FirestoreQuery<Type>);
			return ((await myQuery.get()).docs as FirestoreType_DocumentSnapshot[]).map(snapshot => snapshot.data() as Type);
		});
	}

	private getAll = async (docs: DocWrapperV2<Type>[], transaction?: Transaction): Promise<(Type | undefined)[]> => {
		if (docs.length === 0)
			return [];
		return (await (transaction ?? this.wrapper.firestore).getAll(...docs.map(_doc => _doc.ref))).map(_snapshot => _snapshot.data() as Type | undefined);
	};

	private async _query(ourQuery?: FirestoreQuery<Type>): Promise<FirestoreType_DocumentSnapshot[]> {
		const myQuery = FirestoreInterfaceV2.buildQuery(this, ourQuery);
		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot[];
	}

	/**
	 * Get the db items from the query
	 * @param ourQuery
	 */
	async queryItems(ourQuery: FirestoreQuery<Type>): Promise<Type[]> {
		return (await this._query(ourQuery)).map(result => result.data() as Type);
	}

	/**
	 * Get DocWrappers per the db objects from the query
	 * @param ourQuery
	 */

	async newQuery(ourQuery: FirestoreQuery<Type>): Promise<DocWrapperV2<Type>[]> {
		const docs = await this._query(ourQuery) as FirestoreType_DocumentSnapshot<Type>[];
		return docs.filter(doc => doc.exists).map(doc => new DocWrapperV2<Type>(doc.ref, doc.data()));
	}

	private _customQuery = async (query?: FirestoreQuery<Type>, transaction?: Transaction): Promise<FirestoreType_DocumentSnapshot<Type>[]> => {
		const myQuery = FirestoreInterfaceV2.buildQuery<Type>(this, query);
		if (transaction)
			return (await transaction.get(myQuery)).docs as FirestoreType_DocumentSnapshot<Type>[];

		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot<Type>[];
	};

	query = {
		unique: async (_id: UniqueId, transaction?: Transaction) => await this.queryDoc.unique(_id).get(transaction),
		all: async (_ids: UniqueId[], transaction?: Transaction) => await this.getAll(this.queryDoc.all(_ids), transaction),
		custom: async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<Type[]> => {
			return (await this._customQuery(query, transaction)).map(snapshot => snapshot.data());
		},
	};

	queryDoc = {
		unique: (_id: UniqueId) => this.getDocWrapper(_id),
		all: (_ids: UniqueId[]) => _ids.map(this.getDocWrapper),
		custom: async (query: FirestoreQuery<Type>, transaction?: Transaction) => {
			return (await this._customQuery(query, transaction)).map(_snapshot => new DocWrapperV2(_snapshot.ref, _snapshot.data()));
		},
	};

	// ############################## Create ##############################
	prepareItemForCreate(preDBItem: PreDB<Type>): Type {
		const now = currentTimeMillis();
		preDBItem._id ??= generateId();
		preDBItem.__updated = preDBItem.__created = now;
		preDBItem._v = this.getVersion();

		return preDBItem as Type;
	}

	getVersion = () => {
		return this.dbDef.versions?.[0] || DefaultDBVersion;
	};

	protected async _createItem(preDBItem: PreDB<Type>, transaction?: Transaction) {
		const dbItem = this.prepareItemForCreate(preDBItem);
		await this.assertDBItem(dbItem);
		const doc = this.getDocWrapperFromItem(dbItem);
		return doc.create(dbItem, transaction);
	}

	protected async _createAll(preDBItems: PreDB<Type>[], retryOnError: boolean = false, transaction?: Transaction): Promise<Type[]> {
		if (transaction)
			return this._createAllTransaction(preDBItems, retryOnError, transaction);

		return this._createBulk(preDBItems, retryOnError);
	}


	protected async _createAllTransaction(preDBItems: PreDB<Type>[], retryOnError: boolean = false, transaction: Transaction): Promise<Type[]> {
		const dbItemsToReturn: Type[] = [];
		const errors: any[] = [];
		await preDBItems.reduce((_transaction, _preDBItem) => {
			const _dbItem = this.prepareItemForCreate(_preDBItem);
			try {
				this.assertDBItem(_dbItem, transaction);
			} catch (e) {
				errors.push(e);
				return _transaction;
			}

			this.getDocWrapperFromItem(_dbItem).create(_dbItem, transaction);
			dbItemsToReturn.push(_dbItem);
			return _transaction;
		}, transaction);

		if (errors.length)
			errors.forEach(error => setTimeout(() => {
				throw new FirestoreException('Failed db item validation during createAllTransaction', error);
			}));
		return dbItemsToReturn;
	}

	protected async _createBulk(preDBItems: PreDB<Type>[], retryOnError: boolean = false): Promise<Type[]> {
		const bulk = this.wrapper.firestore.bulkWriter();
		const dbItemsToReturn: Type[] = [];
		const errors: any[] = [];

		bulk.onWriteError(error => {
			errors.push(new FirestoreException(error.message));
			return retryOnError;
		});
		await preDBItems.reduce((_bulk, _preDBItem) => {
			const _dbItem = this.prepareItemForCreate(_preDBItem);
			try {
				this.assertDBItem(_dbItem);

			} catch (e) {
				errors.push(e);
				return _bulk;
			}

			this.addBulkCreate(_bulk, _dbItem);
			dbItemsToReturn.push(_dbItem);
			return _bulk;
		}, bulk).flush();

		if (errors.length) {
			throw new FirestoreException(__stringify(errors));
		}

		return dbItemsToReturn;
	}

	private async addBulkCreate(bulk: FirebaseFirestore.BulkWriter, dbItem: Type) {
		return bulk.create(this.getDocWrapperFromItem(dbItem).ref, dbItem);
	}

	create = {
		item: async (item: PreDB<Type>, transaction?: Transaction) => await this._createItem(item, transaction),
		all: async (items: PreDB<Type>[], transaction?: Transaction) => await this._createAll(items, false, transaction),
	};

	// ############################## Set ##############################
	prepareItemForSet(preDBItem: PreDB<Type>): Type {
		const now = currentTimeMillis();
		preDBItem._id ??= generateId();
		preDBItem.__created ??= now;
		preDBItem.__updated = now;
		preDBItem._v ??= this.getVersion();
		return preDBItem as Type;
	}

	protected async _setItem(preDBItem: PreDB<Type>, transaction?: Transaction) {
		const dbItem = this.prepareItemForSet(preDBItem);
		await this.assertDBItem(dbItem, transaction);
		const doc = this.getDocWrapperFromItem(dbItem);
		return doc.set(dbItem, transaction);
	}

	protected async _setAll(preDBItems: PreDB<Type>[], transaction?: Transaction) {
		if (transaction)
			return this._setAllTransaction(preDBItems, transaction);

		return this._setBulk(preDBItems);
	}

	protected async _setBulk(preDBItems: PreDB<Type>[], transaction?: Transaction): Promise<Type[]> {
		const bulk = this.wrapper.firestore.bulkWriter();
		const dbItems: Type[] = [];

		await preDBItems.reduce((_bulk, _preDBItem) => {
			const _dbItem = this.prepareItemForSet(_preDBItem);
			_bulk.set(this.getDocWrapperFromItem(_preDBItem).ref, _dbItem);
			dbItems.push(_dbItem);
			return _bulk;
		}, bulk).close();

		return dbItems;
	}

	protected async _setAllTransaction(preDBItems: PreDB<Type>[], transaction: Transaction): Promise<Type[]> {
		const dbItemsToReturn: Type[] = [];
		const errors: any[] = [];

		await preDBItems.reduce((_transaction, _preDBItem) => {
			const _dbItem = this.prepareItemForSet(_preDBItem);

			try {
				this.assertDBItem(_dbItem, transaction);
			} catch (e) {
				errors.push(e);
				return _transaction;
			}

			this.getDocWrapperFromItem(_preDBItem).set(_dbItem, transaction);
			dbItemsToReturn.push(_dbItem);
			return _transaction;
		}, transaction);

		errors.forEach(error => setTimeout(() => {
			throw new FirestoreException('Failed db item validation during createAllTransaction', error);
		}));

		return dbItemsToReturn;
	}

	set = {
		item: async (item: PreDB<Type>, transaction?: Transaction) => await this._setItem(item, transaction),
		all: async (items: PreDB<Type>[], transaction?: Transaction) => await this._setAll(items, transaction),
	};

	// ############################## Update ##############################

	private async prepareDataForUpdate(updateData: UpdateObject<Type>) {
		delete updateData.__created;
		delete updateData._v;
		updateData.__updated = currentTimeMillis();
		this.updateDeletedFields(updateData);
		await this.assertUpdateData(updateData);
		return updateData;
	}

	protected _update = async (updateData: UpdateObject<Type>, transaction?: Transaction) => {
		const doc = this.getDocWrapper(updateData._id);
		await this.prepareDataForUpdate(updateData);
		//todo assert
		// await this.assertDBItem(updateData, transaction);

		delete (updateData as UpdateData<Type>)._id;
		await doc.update(updateData, transaction);
		return doc.get();
	};

	protected _updateAll = async (updateData: UpdateObject<Type>[], transaction?: Transaction) => {
		if (transaction)
			return this._updateAllTransaction(updateData, transaction);

		return this._updateBulk(updateData);
	};

	protected _updateAllTransaction = async (updateData: UpdateObject<Type>[], transaction: Transaction) => {
		const toUpdate = await Promise.all(updateData.map(async _data => await this.prepareDataForUpdate(_data)));
		const errors: any[] = [];

		await toUpdate.reduce((_transaction, _data) => {
			//to assert?
			try {
				//todo assert
				//this.assertDBItem(_data, transaction);
			} catch (e) {
				errors.push(e);
				return _transaction;
			}

			delete (updateData as UpdateData<Type>)._id;
			this.getDocWrapper(_data._id).update(_data, transaction);
			return _transaction;
		}, transaction);

		errors.forEach(error => setTimeout(() => {
			throw new FirestoreException('Failed db item validation during createAllTransaction', error);
		}));

		return await this.query.all(updateData.map(_data => _data._id));
	};

	protected _updateBulk = async (updateData: UpdateObject<Type>[]): Promise<Type[]> => {
		const toUpdate = await Promise.all(updateData.map(async _data => await this.prepareDataForUpdate(_data)));
		const bulk = this.wrapper.firestore.bulkWriter();
		const errors: any[] = [];

		await toUpdate.reduce((_bulk, _data) => {
			try {
				//todo assert
				// this.assertDBItem(updateData);
			} catch (e) {
				errors.push(e);
				return _bulk;
			}

			delete (updateData as UpdateData<Type>)._id;
			_bulk.update(this.getDocWrapper(_data._id).ref, _data);
			return _bulk;
		}, bulk).close();

		errors.forEach(error => setTimeout(() => {
			throw new FirestoreException('Failed db item validation during createAllTransaction', error);
		}));

		return await this.query.all(updateData.map(_data => _data._id)) as Type[];
	};

	/**
	 * Recursively replaces any undefined or null fields in DB item with firestore.FieldValue.delete()
	 * @param updateData: data to update in DB item
	 * @private
	 */
	private updateDeletedFields(updateData: UpdateObject<Type | Type[keyof Type]>) {
		if (typeof updateData !== 'object' || updateData === null)
			return;

		_keys(updateData).forEach(_key => {
			const _value = updateData[_key];

			if (!exists(_value)) {
				// @ts-ignore
				updateData[_key] = FieldValue.delete();
			} else {
				this.updateDeletedFields(_value as UpdateObject<Type | Type[keyof Type]>);
			}
		});
	}

	private async assertUpdateData(updateData: UpdateData<Type>) {
	}

	update = {
		item: this._update,
		all: this._updateAll,
	};

	// ############################## Upsert ##############################

	private _upsert = async (item: PreDB<Type> | UpdateObject<Type>, transaction?: Transaction): Promise<Type> => {
		let dbItem;
		if (exists(item._id)) {
			dbItem = this.getDocWrapper(item._id!).get();
		}

		if (dbItem)
			return await this.update.item(item as UpdateObject<Type>, transaction);
		else
			return await this.create.item(item as PreDB<Type>, transaction);
	};

	private _upsertAll = async (items: PreDB<Type>[] | UpdateObject<Type>[], transaction?: Transaction): Promise<Type[]> => {
		const {
			filteredIn: hasIdItems,
			filteredOut: noIdItems
		} = filterInOut<PreDB<Type> | UpdateObject<Type>>(items, _item => exists(_item._id));
		const toCreate = noIdItems; // If the items don't have _id, we need to create them
		const toUpdate: UpdateObject<Type>[] = []; // We don't fill the toUpdate yet, since we don't know if items with _id also exist in Firestore

		// Query for all items that have _id, to see if they exist
		const dbItems = await this.query.all(hasIdItems.map(_item => _item._id!));
		// Items with _id that exist, are to be updated. Items with _id that don't exist, are added to be created.
		dbItems.forEach((_item, i) => !exists(_item) ? toCreate.push(hasIdItems[i]) : toUpdate.push(hasIdItems[i] as UpdateObject<Type>));

		return flatArray(await Promise.all([
			this.update.all(toUpdate, transaction),
			this.create.all(toCreate as PreDB<Type>[], transaction)
		]));
	};

	upsert = {
		item: this._upsert,
		all: this._upsertAll
	};

	// ############################## Delete ##############################

	protected _deleteUnique = async (_id: UniqueId, transaction?: Transaction) => {
		if (!_id)
			throw new MUSTNeverHappenException('Cannot deleteUnique without an _id!');

		const doc = this.queryDoc.unique(_id);
		const dbItem = await doc.get(transaction);
		await this.canDeleteDocument([dbItem], transaction);
		await doc.delete(transaction);
	};

	protected async _deleteQuery(query: FirestoreQuery<Type>, transaction?: Transaction) {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const items = await this.query.custom(query, transaction);
		return this._deleteAll(items.map(this.getDocWrapperFromItem), transaction);
	}

	protected async _deleteAll(docs: DocWrapperV2<Type>[], transaction?: Transaction) {
		const dbItems = filterInstances(await this.getAll(docs));
		await this.canDeleteDocument(dbItems, transaction);
		if (transaction)
			return this._deleteAllTransaction(docs, transaction);

		return this._deleteBulk(docs);
	}

	protected async _deleteBulk(docs: DocWrapperV2<Type>[]) {
		await this._deleteBulkRefs(docs.map(_doc => _doc.ref));
	}

	protected async _deleteBulkRefs(refs: DocumentReference[]) {
		const bulk = this.wrapper.firestore.bulkWriter();
		refs.forEach(_ref => bulk.delete(_ref));
		await bulk.close();
	}

	protected async _deleteAllTransaction(docs: DocWrapperV2<Type>[], transaction: Transaction) {
		return docs.map(doc => doc.delete(transaction));
	}

	async deleteCollection() {
		const refs = await this.collection.listDocuments();
		await this._deleteBulkRefs(refs);
	}

	delete = {
		unique: this._deleteUnique,
		item: async (item: PreDB<Type>, transaction?: Transaction) => await this.getDocWrapperFromItem(item).delete(transaction),
		all: async (_ids: UniqueId[], transaction?: Transaction) => await this._deleteAll(_ids.map(_id => this.getDocWrapper(_id)), transaction),
		allItems: async (items: PreDB<Type>[], transaction?: Transaction) => await this._deleteAll(items.map(_item => this.getDocWrapperFromItem(_item)), transaction),
		query: this._deleteQuery
	};

	// ############################## General ##############################
	/**
	 * A firestore transaction is run globally on the firestore project and not specifically on any collection, locking specific documents in the project.
	 * @param processor: A set of read and write operations on one or more documents.
	 */
	async runTransaction<ReturnType>(processor: (transaction: Transaction) => Promise<ReturnType>): Promise<ReturnType> {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction<ReturnType>(processor);
	}

	private async assertDBItem(dbItem: Type, transaction?: Transaction, request?: Express.Request) {
		await this.upgradeDBItem([dbItem]);
		await this.preUpsertProcessing(dbItem, transaction, request);
		this.validateImpl(dbItem);
		await this.assertUniqueness(dbItem, transaction, request);
	}

	private upgradeDBItem(dbItems: Type[]) {
		//todo - maybe should be filled only in extending modules
	}

	private async preUpsertProcessing(dbItem: Type, transaction?: Transaction, request?: Express.Request) {
		//todo - maybe should be filled only in extending modules
	}

	private validateImpl(dbItem: Type) {
		const results = tsValidateResult(dbItem, this.validator);
		if (results) {
			this.onValidationError(dbItem, results);
		}
	}

	protected onValidationError(instance: Type, results: InvalidResult<Type>) {
		StaticLogger.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		const errorBody = {type: 'bad-input', body: {result: results, input: instance}};
		throw new ApiException(400, `error validating ${this.dbDef.entityName}`).setErrorBody(errorBody as any);
	}

	private assertUniqueness(dbItem: Type, transaction?: Transaction, request?: Express.Request) {
	}

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 *
	 * Currently, executed only before `deleteUnique()`.
	 *
	 * @param transaction - The transaction object
	 * @param dbItems - The DB entry that is going to be deleted.
	 */
	protected async canDeleteDocument(dbItems: Type[], transaction?: Transaction) {
		const dependencies = await this.collectDependencies(dbItems, transaction);
		if (dependencies)
			throw new ApiException<DB_EntityDependency<any>[]>(422, 'entity has dependencies').setErrorBody({
				type: 'has-dependencies',
				body: dependencies
			});
	}

	async collectDependencies(dbInstances: Type[], transaction?: Transaction) {
		const potentialErrors = await canDeleteDispatcherV2.dispatchModuleAsync(this.dbDef.entityName, dbInstances, transaction);
		const dependencies = filterInstances(potentialErrors.map(item => (item?.conflictingIds.length || 0) === 0 ? undefined : item));
		return dependencies.length > 0 ? dependencies : undefined;
	}
}