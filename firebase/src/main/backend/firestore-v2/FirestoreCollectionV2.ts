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
	Const_UniqueKeys,
	CustomException,
	DB_Object,
	DB_Object_validator,
	DBDef,
	Default_UniqueKey,
	DefaultDBVersion,
	exists,
	filterInstances,
	generateHex,
	IndexKeys,
	InvalidResult,
	KeysOfDB_Object,
	MUSTNeverHappenException,
	PreDB,
	StaticLogger,
	tsValidateResult,
	TypedMap,
	UniqueId,
	UniqueParam,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentReference, FirestoreType_DocumentSnapshot} from '../firestore/types';
import {FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV2} from './FirestoreInterfaceV2';
import {firestore} from 'firebase-admin';
import {BulkItem, BulkOperation, DocWrapperV2, UpdateObject} from './DocWrapperV2';
import {_values} from '@nu-art/ts-common/utils/object-tools';
import {composeItemId} from "../../shared/utils";
import UpdateData = firestore.UpdateData;


export type FirestoreCollectionHooks<Type extends DB_Object> = {
	canDeleteItems: (dbItems: Type[], transaction?: Transaction) => Promise<void>,
	prepareItemForDB?: (dbInstance: PreDB<Type>, transaction?: Transaction) => Promise<void>,
	manipulateQuery?: (query: FirestoreQuery<Type>) => FirestoreQuery<Type>
}

export const _EmptyQuery = Object.freeze({where: {}});
export const dbIdLength = 32;

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
export class FirestoreCollectionV2<Type extends DB_Object, Ks extends keyof PreDB<Type> = Default_UniqueKey> {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBEV2;
	readonly collection: FirestoreType_Collection;
	readonly dbDef: DBDef<Type, any>;
	readonly uniqueKeys: Ks[];
	private readonly validator: ValidatorTypeResolver<Type>;
	readonly hooks?: FirestoreCollectionHooks<Type>;

	constructor(wrapper: FirestoreWrapperBEV2, _dbDef: DBDef<Type, Ks>, hooks?: FirestoreCollectionHooks<Type>) {
		this.name = _dbDef.dbName;
		this.wrapper = wrapper;
		if (!/[a-z-]{3,}/.test(_dbDef.dbName))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.collection = wrapper.firestore.collection(_dbDef.dbName);
		this.dbDef = _dbDef;
		this.uniqueKeys = this.dbDef.uniqueKeys || Const_UniqueKeys;
		this.validator = this.getValidator(_dbDef);
		this.hooks = hooks;
	}

	getValidator = (dbDef: DBDef<Type, Ks>): ValidatorTypeResolver<Type> => {
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
		unique: (id: UniqueParam<Type, Ks>) => {
			if (!id)
				throw new MUSTNeverHappenException('Did not receive an _id at doc.unique!');

			if (typeof id !== 'string') {
				id = getItemId(id, this.uniqueKeys);
			}

			const doc = this.wrapper.firestore.doc(`${this.name}/${id}`) as FirestoreType_DocumentReference<Type>;
			return this.doc._(doc);
		},
		item: (item: PreDB<Type>) => {
			return this.doc.unique(item as IndexKeys<Type, Ks>);
		},
		all: (_ids: (UniqueParam<Type, Ks>)[]) => _ids.map(this.doc.unique),
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

	private _customQuery = async (tsQuery: FirestoreQuery<Type>, transaction?: Transaction): Promise<FirestoreType_DocumentSnapshot<Type>[]> => {
		tsQuery = this.hooks?.manipulateQuery?.(tsQuery) ?? tsQuery;
		const firestoreQuery = FirestoreInterfaceV2.buildQuery<Type>(this, tsQuery);
		if (transaction)
			return (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<Type>[];

		return (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<Type>[];
	};

	query = {
		unique: async (_id: UniqueParam<Type, Ks>, transaction?: Transaction) => await this.doc.unique(_id).get(transaction),
		uniqueAssert: async (_id: UniqueParam<Type, Ks>, transaction?: Transaction): Promise<Type> => {
			const resultItem = await this.query.unique(_id, transaction);
			if (!resultItem)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with _id: ${_id}`);

			return resultItem;
		},
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
		all: async (_ids: (UniqueParam<Type, Ks>)[], transaction?: Transaction) => await this.getAll(this.doc.all(_ids), transaction),
		custom: async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<Type[]> => {
			return (await this._customQuery(query, transaction)).map(snapshot => snapshot.data());
		},
	};

	// ############################## Create ##############################
	protected _createAll = async (preDBItems: PreDB<Type>[], transaction?: Transaction): Promise<Type[]> => {
		if (preDBItems.length === 1)
			return [await this.create.item(preDBItems[0], transaction)];

		const docs = this.doc.allItems(preDBItems);
		const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForCreate(preDBItems[i], transaction)));
		this.assertNoDuplicatedIds(dbItems, 'create.all');

		if (transaction)
			docs.forEach((doc, i) => transaction.create(doc.ref, dbItems[i]));
		else
			await this.bulkOperation(docs, 'create', dbItems);
		return dbItems;
	};

	create = {
		item: async (preDBItem: PreDB<Type>, transaction?: Transaction): Promise<Type> => await this.doc.item(preDBItem).create(preDBItem, transaction),
		all: this._createAll,
	};

	// ############################## Set ##############################
	protected _setAll = async (items: (PreDB<Type> | Type)[], transaction?: Transaction) => {
		const docs = this.doc.allItems(items);
		const dbItems = await this.getAll(docs);

		const preparedItems = await Promise.all(dbItems.map(async (_dbItem, i) => {
			return !exists(_dbItem) ? await docs[i].prepareForCreate(items[i], transaction) : await docs[i].prepareForSet(items[i] as Type, _dbItem!, transaction);
		}));
		this.assertNoDuplicatedIds(preparedItems, 'set.all');

		if (transaction)
			// here we do not call doc.set because we have performed all the preparation for the dbitems as a group of items before this call
			docs.map((doc, i) => transaction.set(doc.ref, preparedItems[i]));
		else
			await this.bulkOperation(docs, 'set', preparedItems);
		return preparedItems;
	};

	set = {
		item: async (preDBItem: PreDB<Type>, transaction?: Transaction) => await this.doc.item(preDBItem).set(preDBItem, transaction),
		all: (items: (PreDB<Type> | Type)[], transaction?: Transaction) => {
			if (transaction)
				return this._setAll(items, transaction);

			return this.runTransaction(t => this._setAll(items, t));
		},
		bulk: (items: (PreDB<Type> | Type)[]) => {
			return this._setAll(items);
		},
	};

	// ############################## Update ##############################
	protected _updateBulk = async (updateData: UpdateObject<Type>[]): Promise<Type[]> => {
		const docs = this.doc.all(updateData.map(_data => _data._id));
		const toUpdate: UpdateObject<Type>[] = await Promise.all(docs.map(async (_doc, i) => await _doc.prepareForUpdate(updateData[i])));
		await this.bulkOperation(docs, 'update', toUpdate);
		return await this.getAll(docs) as Type[];
	};

	async validateUpdateData(updateData: UpdateData<Type>, transaction?: Transaction) {
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
		const dbItems = filterInstances(await this.getAll(docs, transaction));
		await this.hooks?.canDeleteItems(dbItems, transaction);
		if (transaction)
			// here we do not call doc.delete because we have performed all the delete preparation as a group of items before this call
			docs.map(async doc => transaction.delete(doc.ref));
		else
			await this.bulkOperation(docs, 'delete');
		return dbItems;
	};

	deleteCollection = async () => {
		const refs = await this.collection.listDocuments();
		const bulk = this.wrapper.firestore.bulkWriter();
		refs.forEach(_ref => bulk.delete(_ref));
		await bulk.close();
	};

	delete = {
		unique: async (id: UniqueParam<Type, Ks>, transaction?: Transaction) => await this.doc.unique(id).delete(transaction),
		item: async (item: PreDB<Type>, transaction?: Transaction) => await this.doc.item(item).delete(transaction),
		all: async (ids: (UniqueParam<Type, Ks>)[], transaction?: Transaction): Promise<Type[]> => {
			if (!transaction)
				return this.runTransaction(t => this.delete.all(ids, t));

			return this._deleteAll(ids.map(id => this.doc.unique(id)), transaction);
		},
		allItems: async (items: PreDB<Type>[], transaction?: Transaction): Promise<Type[]> => {
			if (!transaction)
				return this.runTransaction(t => this.delete.allItems(items, t));

			return await this._deleteAll(items.map(_item => this.doc.item(_item)), transaction);
		},
		/**
		 * Bulk is a non atomic delete operation
		 */
		bulk: {
			all: async (ids: UniqueId[], transaction?: Transaction) => await this._deleteAll(ids.map(id => this.doc.unique(id)), transaction),
			items: async (items: PreDB<Type>[], transaction?: Transaction) => await this._deleteAll(items.map(_item => this.doc.item(_item)), transaction),
		},
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

	private assertNoDuplicatedIds(items: Type[], originFunctionName: string) {
		const idCountMap: TypedMap<number> = items.reduce<TypedMap<number>>((countMap, item) => {
			// Count the number of appearances of each _id
			countMap[item._id] = !exists(countMap[item._id]) ? 1 : 1 + countMap[item._id];
			return countMap;
		}, {});

		// Throw exception if an _id appears more than once
		if (_values(idCountMap).some(count => count > 1))
			throw new BadImplementationException(`${originFunctionName} received the same _id twice.`);
	}
}

/**
 * If the collection has unique keys, assert they exist, and use them to generate the _id.
 * In the case an _id already exists, verify it is not different from the uniqueKeys-generated _id.
 */
export const getItemId = <T extends PreDB<DB_Object>, K extends (keyof T)[]>(item: T, keys: K) => {
	// If there are no specific uniqueKeys, generate a random _id.
	if (compare(keys, Const_UniqueKeys as K))
		return item._id ?? generateHex(dbIdLength)

	const _id = composeItemId(item, keys);
	// If the item has an _id, and it matches the uniqueKeys-generated _id, all is well.
	// If the uniqueKeys-generated _id doesn't match the existing _id, this means someone had changed the uniqueKeys or _id which must never happen.
	if (exists(item._id) && _id !== item._id)
		throw new MUSTNeverHappenException(`When checking the existing _id, it did not match the _id composed from the unique keys!`);

	return _id;
};