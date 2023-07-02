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
	ApiException,
	BadImplementationException,
	compare,
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
	tsValidateResult,
	UniqueId,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentReference, FirestoreType_DocumentSnapshot} from '../firestore/types';
import {FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV2} from './FirestoreInterfaceV2';
import {firestore} from 'firebase-admin';
import {BulkItem, BulkOperation, DocWrapperV2, UpdateObject} from './DocWrapperV2';
import UpdateData = firestore.UpdateData;

export type FirestoreCollectionHooks<Type extends DB_Object> = {
	canDeleteItems: (dbItems: Type[], transaction?: Transaction) => Promise<void>,
	prepareItemForDB: (dbInstance: Type, transaction?: Transaction) => Promise<void>
}

export const _EmptyQuery = Object.freeze({where: {}});
export const dbIdLength = 32;

export function generateId() {
	return generateHex(dbIdLength);
}

/**
 * # <ins>FirestoreBulkException</ins>
 * @category Exceptions
 */
export class FirestoreBulkException
	extends CustomException {
	public causes?: Error[];

	constructor(causes?: Error[]) {
		super(FirestoreBulkException, __stringify(causes?.map(_err => _err.message)));
		this.causes = causes;
	}
}

/**
 * FirestoreCollection is a class for handling Firestore collections.
 */
export class FirestoreCollectionV2<Type extends DB_Object> {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBEV2;
	readonly collection: FirestoreType_Collection;
	readonly dbDef: DBDef<Type, any>;
	private readonly validator: ValidatorTypeResolver<Type>;
	readonly hooks?: FirestoreCollectionHooks<Type>;

	constructor(wrapper: FirestoreWrapperBEV2, _dbDef: DBDef<Type>, hooks?: FirestoreCollectionHooks<Type>) {
		this.name = _dbDef.dbName;
		this.wrapper = wrapper;
		if (!/[a-z-]{3,}/.test(_dbDef.dbName))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.collection = wrapper.firestore.collection(_dbDef.dbName);
		this.dbDef = _dbDef;
		this.validator = this.getValidator(_dbDef);
		this.hooks = hooks;
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
	doc = {
		_: (ref: FirestoreType_DocumentReference<Type>, data?: Type): DocWrapperV2<Type> => {
			// @ts-ignore
			return new DocWrapperV2(this, ref, data);
		},
		unique: (_id: UniqueId) => {
			const doc = this.wrapper.firestore.doc(`${this.name}/${_id}`) as FirestoreType_DocumentReference<Type>;
			return this.doc._(doc);
		},
		item: (item: PreDB<Type>) => {
			if (!exists(item._id))
				throw new BadImplementationException('Cannot create DocWrapper without _id!');

			return this.doc.unique(item._id!);
		},
		all: (_ids: UniqueId[]) => _ids.map(this.doc.unique),
		allItems: (preDBItems: PreDB<Type>[]) => {
			// At this point all preDB MUST have ids
			return preDBItems.map(preDBItem => this.doc.item(preDBItem));
		},
		query: async (query: FirestoreQuery<Type>, transaction?: Transaction) => {
			return (await this._customQuery(query, transaction)).map(_snapshot => this.doc._(_snapshot.ref, _snapshot.data()));
		}
	};

	// ############################## Query ##############################
	private getAll = async (docs: DocWrapperV2<Type>[], transaction?: Transaction): Promise<(Type | undefined)[]> => {
		if (docs.length === 0)
			return [];
		return (await (transaction ?? this.wrapper.firestore).getAll(...docs.map(_doc => _doc.ref))).map(_snapshot => _snapshot.data() as Type | undefined);
	};

	private _customQuery = async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<FirestoreType_DocumentSnapshot<Type>[]> => {
		const myQuery = FirestoreInterfaceV2.buildQuery<Type>(this, query);
		if (transaction)
			return (await transaction.get(myQuery)).docs as FirestoreType_DocumentSnapshot<Type>[];

		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot<Type>[];
	};

	query = {
		unique: async (_id: UniqueId, transaction?: Transaction) => await this.doc.unique(_id).get(transaction),
		uniqueCustom: async (query: FirestoreQuery<Type>, transaction?: Transaction) => {
			const thisShouldBeOnlyOne = await this.query.custom(query, transaction);
			if (thisShouldBeOnlyOne.length !== 1) {
				if (thisShouldBeOnlyOne.length > 1)
					throw new BadImplementationException(`too many results for query: ${__stringify(query)} in collection: ${this.dbDef.dbName}`);
				else
					throw new ApiException(404, `Could not find ${this.dbDef.entityName} with unique query: ${JSON.stringify(query)}`);

			}
			return thisShouldBeOnlyOne[0];
		},
		all: async (_ids: UniqueId[], transaction?: Transaction) => await this.getAll(this.doc.all(_ids), transaction),
		custom: async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<Type[]> => {
			return (await this._customQuery(query, transaction)).map(snapshot => snapshot.data());
		},
	};

	// ############################## Create ##############################
	protected _createItem = async (preDBItem: PreDB<Type>, transaction?: Transaction): Promise<Type> => {
		preDBItem._id ??= generateId();
		return await this.doc.item(preDBItem).create(preDBItem, transaction);
	};

	protected _createAll = async (preDBItems: PreDB<Type>[], transaction?: Transaction): Promise<Type[]> => {
		if (preDBItems.length === 1)
			return [await this._createItem(preDBItems[0], transaction)];

		preDBItems.forEach(preDBItem => preDBItem._id ??= generateId());
		const docs = this.doc.allItems(preDBItems);
		const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForCreate(preDBItems[i], transaction)));

		if (transaction)
			docs.forEach((doc, i) => transaction.create(doc.ref, dbItems[i]));
		else
			await this.bulkOperation(docs, 'create', dbItems);
		return dbItems;
	};

	create = {
		item: this._createItem,
		all: this._createAll,
	};

	// ############################## Set ##############################
	protected _setAll = async (items: (PreDB<Type> | Type)[], transaction?: Transaction) => {
		const {
			filteredIn: hasIdItems,
			filteredOut: noIdItems
		} = filterInOut<PreDB<Type> | Type>(items, _item => exists(_item._id));
		const toCreate = noIdItems; // If the items don't have _id, we need to create them
		const toSet: [Type, Type][] = []; // A tuple of the new item to set (0) and the current dbItem (1)

		// Query for all items that have _id, to see if they exist
		const dbItems = await this.query.all(hasIdItems.map(_item => _item._id!));
		// Items with _id that exist, are to be updated. Items with _id that don't exist, are added to be created.
		dbItems.forEach((_item, i) => !exists(_item) ? toCreate.push(hasIdItems[i]) : toSet.push([hasIdItems[i] as Type, _item!]));

		return flatArray(await Promise.all([
			this.create.all(toCreate as PreDB<Type>[], transaction),
			this._setExistingAll(toSet, transaction)
		]));
	};

	/**
	 * Set operation that updates multiple existing dbItems.
	 * @param toSet: A tuple of the new item to set (0) and the current dbItem (1).
	 * @param transaction: Transaction
	 */
	protected _setExistingAll = async (toSet: [Type, Type][], transaction?: Transaction): Promise<Type[]> => {
		const docs = this.doc.all(toSet.map(_item => _item[0]._id));
		const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForSet(...toSet[i], transaction)));
		if (transaction)
			docs.map((doc, i) => transaction.set(doc.ref, dbItems[i]));
		else
			await this.bulkOperation(docs, 'set', dbItems);
		return dbItems;
	};

	set = {
		item: async (preDBItem: PreDB<Type>, transaction?: Transaction) => {
			if (!preDBItem._id)
				return this.create.item(preDBItem, transaction);
			return await this.doc.item(preDBItem).set(preDBItem, transaction);
		},
		all: this._setAll,
	};

	// ############################## Update ##############################
	protected _updateBulk = async (updateData: UpdateObject<Type>[]): Promise<Type[]> => {
		const docs = this.doc.all(updateData.map(_data => _data._id));
		const toUpdate: UpdateObject<Type>[] = await Promise.all(docs.map(async (_doc, i) => await _doc.prepareForUpdate(updateData[i])));
		await this.bulkOperation(docs, 'update', toUpdate);
		return await this.getAll(docs) as Type[];
	};

	async assertUpdateData(updateData: UpdateData<Type>, transaction?: Transaction) {
	}

	update = {
		item: (updateData: UpdateObject<Type>) => this.doc.unique(updateData._id).update(updateData),
		all: this._updateBulk,
	};

	// ############################## Delete ##############################
	protected _deleteQuery = async (query: FirestoreQuery<Type>, transaction?: Transaction) => {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const docsToBeDeleted = await this.doc.query(query, transaction);
		// Because we query for docs, these docs and their data must exist in Firestore.
		const itemsToReturn = docsToBeDeleted.map(doc => doc.data!); // Data must exist here.
		await this._deleteAll(docsToBeDeleted, transaction);
		return itemsToReturn;
	};

	protected _deleteAll = async (docs: DocWrapperV2<Type>[], transaction?: Transaction) => {
		const dbItems = filterInstances(await this.getAll(docs));
		await this.hooks?.canDeleteItems(dbItems, transaction);
		if (transaction)
			docs.forEach(doc => doc.delete(transaction));
		else
			await this.bulkOperation(docs, 'delete');
	};

	deleteCollection = async () => {
		const refs = await this.collection.listDocuments();
		const bulk = this.wrapper.firestore.bulkWriter();
		refs.forEach(_ref => bulk.delete(_ref));
		await bulk.close();
	};

	delete = {
		unique: (id: string, transaction?: Transaction) => this.doc.unique(id).delete(transaction),
		item: async (item: PreDB<Type>, transaction?: Transaction) => await this.doc.item(item).delete(transaction),
		all: async (_ids: UniqueId[], transaction?: Transaction) => await this._deleteAll(_ids.map(_id => this.doc.unique(_id)), transaction),
		allItems: async (items: PreDB<Type>[], transaction?: Transaction) => await this._deleteAll(items.map(_item => this.doc.item(_item)), transaction),
		query: this._deleteQuery
	};

	// ############################## General ##############################
	protected bulkOperation = async <Op extends BulkOperation>(docs: DocWrapperV2<Type>[], operation: Op, items?: BulkItem<Op, Type>[]) => {
		const bulk = this.wrapper.firestore.bulkWriter();

		const errors: Error[] = [];
		bulk.onWriteError(error => {
			errors.push(error);
			return false;
		});

		docs.forEach((doc, index) => doc.addToBulk(bulk, operation, items?.[index]));
		await bulk.close();

		if (errors.length)
			throw new FirestoreBulkException(errors);
	};

	/**
	 * A firestore transaction is run globally on the firestore project and not specifically on any collection, locking specific documents in the project.
	 * @param processor: A set of read and write operations on one or more documents.
	 */
	runTransaction = async <ReturnType>(processor: (transaction: Transaction) => Promise<ReturnType>): Promise<ReturnType> => {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction<ReturnType>(processor);
	};

	getVersion = () => {
		return this.dbDef.versions?.[0] || DefaultDBVersion;
	};

	validateItem(dbItem: Type) {
		const results = tsValidateResult(dbItem, this.validator);
		if (results) {
			this.onValidationError(dbItem, results);
		}
	}

	protected onValidationError(instance: Type, results: InvalidResult<Type>) {
		StaticLogger.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		// console.error(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		const errorBody = {type: 'bad-input', body: {result: results, input: instance}};
		throw new ApiException(400, `error validating ${this.dbDef.entityName}`).setErrorBody(errorBody as any);
	}
}