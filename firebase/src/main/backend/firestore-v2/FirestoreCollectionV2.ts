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
	dbObjectToId,
	Default_UniqueKey,
	DefaultDBVersion, Exception,
	exists,
	filterDuplicates,
	filterInstances,
	generateHex,
	InvalidResult,
	keepDBObjectKeys,
	Logger,
	MUSTNeverHappenException,
	PreDB,
	StaticLogger,
	tsValidateResult,
	TypedMap,
	UniqueId,
	UniqueParam,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {
	FirestoreType_Collection,
	FirestoreType_DocumentReference,
	FirestoreType_DocumentSnapshot
} from '../firestore/types';
import {Clause_Where, FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV2} from './FirestoreInterfaceV2';
import {firestore} from 'firebase-admin';
import {DocWrapperV2, UpdateObject} from './DocWrapperV2';
import {_values} from '@nu-art/ts-common/utils/object-tools';
import {composeDbObjectUniqueId} from '../../shared/utils';
import UpdateData = firestore.UpdateData;
import WriteBatch = firestore.WriteBatch;
import BulkWriter = firestore.BulkWriter;

// {deleted: null} means that the whole collection has been deleted
export type PostWriteProcessingData<Type extends DB_Object> = { updated?: Type | Type[], deleted?: Type | Type[] | null };

export type FirestoreCollectionHooks<Type extends DB_Object> = {
	canDeleteItems: (dbItems: Type[], transaction?: Transaction) => Promise<void>,
	preWriteProcessing?: (dbInstance: PreDB<Type>, transaction?: Transaction) => Promise<void>,
	postWriteProcessing?: (data: PostWriteProcessingData<Type>) => Promise<void>,
	manipulateQuery?: (query: FirestoreQuery<Type>) => FirestoreQuery<Type>,
}

export type MultiWriteOperation = 'create' | 'set' | 'update' | 'delete';

export type MultiWriteItem<Op extends MultiWriteOperation, T extends DB_Object> =
	Op extends 'delete' ? undefined :
		Op extends 'update' ? UpdateObject<T> :
			T;

type MultiWriteType = 'bulk' | 'batch';

const defaultMultiWriteType = 'batch';
export const _EmptyQuery = Object.freeze({where: {}});
export const dbIdLength = 32;
export const maxBatch = 500;

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
export class FirestoreCollectionV2<Type extends DB_Object, Ks extends keyof PreDB<Type> = Default_UniqueKey>
	extends Logger {
	readonly name: string;
	readonly wrapper: FirestoreWrapperBEV2;
	readonly collection: FirestoreType_Collection;
	readonly dbDef: DBDef<Type, any>;
	readonly uniqueKeys: Ks[];
	private readonly validator: ValidatorTypeResolver<Type>;
	readonly hooks?: FirestoreCollectionHooks<Type>;

	constructor(wrapper: FirestoreWrapperBEV2, _dbDef: DBDef<Type, Ks>, hooks?: FirestoreCollectionHooks<Type>) {
		super();
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
				const dbObjectOnly = keepDBObjectKeys(instance);
				return tsValidateResult(dbObjectOnly, DB_Object_validator);
			}), dbDef.validator] as ValidatorTypeResolver<Type> :
			{...DB_Object_validator, ...dbDef.validator} as ValidatorTypeResolver<Type>;
	};

	// ############################## DocWrapper ##############################
	doc = Object.freeze({
		_: (ref: FirestoreType_DocumentReference<Type>, data?: Type): DocWrapperV2<Type> => {
			// @ts-ignore
			return new DocWrapperV2(this, ref, data);
		},
		unique: (id: UniqueParam<Type, Ks>) => {
			if (!id)
				throw new MUSTNeverHappenException('Did not receive an _id at doc.unique!');

			if (typeof id !== 'string')
				id = assertUniqueId(id, this.uniqueKeys);

			const doc = this.wrapper.firestore.doc(`${this.name}/${id}`) as FirestoreType_DocumentReference<Type>;
			return this.doc._(doc);
		},
		item: (item: PreDB<Type>) => {
			item._id = assertUniqueId(item, this.uniqueKeys);
			return this.doc.unique(item._id);
		},
		all: (_ids: (UniqueParam<Type, Ks>)[]) => _ids.map(this.doc.unique),
		allItems: (preDBItems: PreDB<Type>[]) => {
			// At this point all preDB MUST have ids
			return preDBItems.map(preDBItem => this.doc.item(preDBItem));
		},
		query: async (query: FirestoreQuery<Type>, transaction?: Transaction) => {
			return (await this._customQuery(query, transaction)).map(_snapshot => this.doc._(_snapshot.ref, _snapshot.data()));
		}
	});

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

	query = Object.freeze({
		unique: async (_id: UniqueParam<Type, Ks>, transaction?: Transaction) => await this.doc.unique(_id).get(transaction),
		uniqueAssert: async (_id: UniqueParam<Type, Ks>, transaction?: Transaction): Promise<Type> => {
			const resultItem = await this.query.unique(_id, transaction);
			if (!resultItem)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with _id: ${_id}`);

			return resultItem;
		},
		uniqueWhere: async (where: Clause_Where<Type>, transaction?: Transaction) => this.query.uniqueCustom({where}, transaction),
		uniqueCustom: async (query: FirestoreQuery<Type>, transaction?: Transaction) => {
			const thisShouldBeOnlyOne = await this.query.custom(query, transaction);
			if (thisShouldBeOnlyOne.length === 0)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with unique query: ${JSON.stringify(query)}`);

			if (thisShouldBeOnlyOne.length > 1)
				throw new BadImplementationException(`too many results for query: ${__stringify(query)} in collection: ${this.dbDef.dbName}`);

			return thisShouldBeOnlyOne[0];
		},
		all: async (_ids: (UniqueParam<Type, Ks>)[], transaction?: Transaction) => await this.getAll(this.doc.all(_ids), transaction),
		custom: async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<Type[]> => {
			return (await this._customQuery(query, transaction)).map(snapshot => snapshot.data());
		},
	});

	// ############################## Create ##############################
	protected _createAll = async (preDBItems: PreDB<Type>[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Type[]> => {
		if (preDBItems.length === 1)
			return [await this.create.item(preDBItems[0], transaction)];

		const docs = this.doc.allItems(preDBItems);
		const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForCreate(preDBItems[i], transaction)));
		this.assertNoDuplicatedIds(dbItems, 'create.all');

		if (transaction)
			docs.forEach((doc, i) => transaction.create(doc.ref, dbItems[i]));
		else
			await this.multiWrite(multiWriteType, docs, 'create', dbItems);

		this.hooks?.postWriteProcessing?.({updated: dbItems});
		return dbItems;
	};

	create = Object.freeze({
		item: async (preDBItem: PreDB<Type>, transaction?: Transaction): Promise<Type> => await this.doc.item(preDBItem).create(preDBItem, transaction),
		all: this._createAll,
	});

	// ############################## Set ##############################
	protected _setAll = async (items: (PreDB<Type> | Type)[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
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
			await this.multiWrite(multiWriteType, docs, 'set', preparedItems);

		await this.hooks?.postWriteProcessing?.({updated: preparedItems});
		return preparedItems;
	};

	set = Object.freeze({
		item: async (preDBItem: PreDB<Type>, transaction?: Transaction) => await this.doc.item(preDBItem).set(preDBItem, transaction),
		all: (items: (PreDB<Type> | Type)[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
			if (transaction)
				return this._setAll(items, transaction, multiWriteType);

			return this.runTransaction(t => this._setAll(items, t));
		},
		/**
		 * Multi is a non atomic operation
		 */
		multi: (items: (PreDB<Type> | Type)[], multiWriteType: MultiWriteType = defaultMultiWriteType) => {
			return this._setAll(items, undefined, multiWriteType);
		},
	});

	// ############################## Update ##############################
	protected _updateAll = async (updateData: UpdateObject<Type>[], multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Type[]> => {
		const docs = this.doc.all(updateData.map(_data => _data._id));
		const toUpdate: UpdateObject<Type>[] = await Promise.all(docs.map(async (_doc, i) => await _doc.prepareForUpdate(updateData[i])));
		await this.multiWrite(multiWriteType, docs, 'update', toUpdate);
		const dbItems = await this.getAll(docs) as Type[];
		this.hooks?.postWriteProcessing?.({updated: dbItems});
		return dbItems;
	};

	async validateUpdateData(updateData: UpdateData<Type>, transaction?: Transaction) {
	}

	update = Object.freeze({
		item: (updateData: UpdateObject<Type>) => this.doc.unique(updateData._id).update(updateData),
		all: this._updateAll,
	});

	// ############################## Delete ##############################
	protected _deleteQuery = async (query: FirestoreQuery<Type>, transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const docsToBeDeleted = await this.doc.query(query, transaction);
		// Because we query for docs, these docs and their data must exist in Firestore.
		const itemsToReturn = docsToBeDeleted.map(doc => doc.data!); // Data must exist here.
		await this._deleteAll(docsToBeDeleted, transaction, multiWriteType);
		return itemsToReturn;
	};

	protected _deleteAll = async (docs: DocWrapperV2<Type>[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		const dbItems = filterInstances(await this.getAll(docs, transaction));
		await this.hooks?.canDeleteItems(dbItems, transaction);
		if (transaction)
			// here we do not call doc.delete because we have performed all the delete preparation as a group of items before this call
			docs.map(async doc => transaction.delete(doc.ref));
		else
			await this.multiWrite(multiWriteType, docs, 'delete');

		await this.hooks?.postWriteProcessing?.({deleted: dbItems});
		return dbItems;
	};

	private deleteCollection = async () => {
		const refs = await this.collection.listDocuments();
		const bulk = this.wrapper.firestore.bulkWriter();
		refs.forEach(_ref => bulk.delete(_ref));
		// deleted: null means that the whole collection has been deleted
		this.hooks?.postWriteProcessing?.({deleted: null});
		await bulk.close();
	};

	delete = Object.freeze({
		unique: async (id: UniqueParam<Type, Ks>, transaction?: Transaction) => await this.doc.unique(id).delete(transaction),
		item: async (item: PreDB<Type>, transaction?: Transaction) => await this.doc.item(item).delete(transaction),
		all: async (ids: (UniqueParam<Type, Ks>)[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Type[]> => {
			if (!transaction)
				return this.runTransaction(t => this.delete.all(ids, t, multiWriteType));

			return this._deleteAll(ids.map(id => this.doc.unique(id)), transaction, multiWriteType);
		},
		allDocs: async (docs: DocWrapperV2<Type>[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Type[]> => {
			if (!transaction)
				return this.runTransaction(t => this.delete.allDocs(docs, t, multiWriteType));

			return await this._deleteAll(docs, transaction, multiWriteType);
		},
		allItems: async (items: PreDB<Type>[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Type[]> => {
			if (!transaction)
				return this.runTransaction(t => this.delete.allItems(items, t, multiWriteType));

			return await this._deleteAll(items.map(_item => this.doc.item(_item)), transaction, multiWriteType);
		},
		query: async (query: FirestoreQuery<Type>, transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Type[]> => {
			if (!transaction)
				return this.runTransaction(t => this.delete.query(query, t, multiWriteType));

			return await this._deleteQuery(query, transaction, multiWriteType);
		},
		/**
		 * Multi is a non atomic operation
		 */
		multi: {
			all: async (ids: UniqueId[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteAll(ids.map(id => this.doc.unique(id)), transaction, multiWriteType),
			items: async (items: PreDB<Type>[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteAll(items.map(_item => this.doc.item(_item)), transaction, multiWriteType),
			query: this._deleteQuery
		},
		yes: {iam: {sure: {iwant: {todelete: {the: {collection: {delete: this.deleteCollection}}}}}}}
	});

	// ############################## Multi Write ##############################
	addToMultiWrite = <Op extends MultiWriteOperation>(writer: BulkWriter | WriteBatch, doc: DocWrapperV2<Type>, operation: Op, item?: MultiWriteItem<Op, Type>) => {
		switch (operation) {
			case 'create':
				writer.create(doc.ref, item as MultiWriteItem<'create', Type>);
				break;
			case 'set':
				// @ts-ignore
				writer.set(doc.ref, item as MultiWriteItem<'set', Type>);
				break;
			case 'update':
				// @ts-ignore
				writer.update(doc.ref, item as MultiWriteItem<'update', Type>);
				break;
			case 'delete':
				writer.delete(doc.ref);
				break;
		}
		return item;
	};

	multiWrite = async <Op extends MultiWriteOperation>(type: MultiWriteType, docs: DocWrapperV2<Type>[], operation: Op, items?: MultiWriteItem<Op, Type>[]) => {
		if (type === 'bulk')
			return this.bulkWrite(docs, operation, items);

		if (type === 'batch')
			return this.batchWrite(docs, operation, items);

		throw new Exception(`Unknown type passed to multiWrite: ${type}`);
	};

	bulkWrite = async <Op extends MultiWriteOperation>(docs: DocWrapperV2<Type>[], operation: Op, items?: MultiWriteItem<Op, Type>[]) => {
		const bulk = this.wrapper.firestore.bulkWriter();

		const errors: Error[] = [];
		bulk.onWriteError(error => {
			errors.push(error);
			return false;
		});

		docs.forEach((doc, index) => this.addToMultiWrite(bulk, doc, operation, items?.[index]));
		await bulk.close();

		if (errors.length)
			throw new FirestoreBulkException(errors);
	};

	batchWrite = async <Op extends MultiWriteOperation>(docs: DocWrapperV2<Type>[], operation: Op, items?: MultiWriteItem<Op, Type>[]) => {
		for (let i = 0; i < docs.length; i += maxBatch) {
			const batch = this.wrapper.firestore.batch();
			const chunk = docs.slice(i, i + maxBatch);
			chunk.map((_doc, index) => this.addToMultiWrite(batch, _doc, operation, items?.[index]));

			await batch.commit();
		}
	};

	// ############################## General ##############################

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
		if (filterDuplicates(items, dbObjectToId).length === items.length)
			return;

		const idCountMap: TypedMap<number> = items.reduce<TypedMap<number>>((countMap, item) => {
			// Count the number of appearances of each _id
			countMap[item._id] = !exists(countMap[item._id]) ? 1 : 1 + countMap[item._id];
			return countMap;
		}, {});

		// Throw exception if an _id appears more than once
		if (_values(idCountMap).some(count => count > 1))
			throw new BadImplementationException(`${originFunctionName} received the same _id twice.`);
	}

	composeDbObjectUniqueId = (item: PreDB<Type>) => {
		return composeDbObjectUniqueId(item, this.uniqueKeys);
	};
}

/**
 * If the collection has unique keys, assert they exist, and use them to generate the _id.
 * In the case an _id already exists, verify it is not different from the uniqueKeys-generated _id.
 */
export const assertUniqueId = <T extends PreDB<DB_Object>, K extends (keyof T)[]>(item: T, keys: K) => {
	// If there are no specific uniqueKeys, generate a random _id.
	if (compare(keys, Const_UniqueKeys as K))
		return item._id ?? generateHex(dbIdLength);

	const _id = composeDbObjectUniqueId(item, keys);
	// If the item has an _id, and it matches the uniqueKeys-generated _id, all is well.
	// If the uniqueKeys-generated _id doesn't match the existing _id, this means someone had changed the uniqueKeys or _id which must never happen.
	if (exists(item._id) && _id !== item._id)
		throw new MUSTNeverHappenException(`When checking the existing _id, it did not match the _id composed from the unique keys! \n expected: ${_id} \n actual: ${item._id}`);

	return _id;
};