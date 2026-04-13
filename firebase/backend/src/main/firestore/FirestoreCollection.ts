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

import {Database, dbObjectToId, DB_Prototype} from '@nu-art/db-api-shared';
import {
	__stringify,
	_keys,
	ApiException,
	BadImplementationException,
	batchActionParallel,
	compare,
	Const_UniqueKeys,
	CustomException,
	DB_Object_validator,
	dbIdLength,
	deepClone,
	DefaultDBVersion,
	Exception,
	exists,
	filterDuplicates,
	filterInstances,
	generateHex,
	InvalidResult,
	keepPartialObject,
	Logger,
	MUSTNeverHappenException,
	StaticLogger,
	TS_Object,
	tsValidateResult,
	tsValidateUniqueId,
	TypedMap,
	UniqueId,
	ValidationException,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentReference, FirestoreType_DocumentSnapshot} from './types.js';
import {Clause_Where, FirestoreQuery, MultiWriteOperation} from '@nu-art/firebase-shared';
import {FirestoreWrapperBE} from './FirestoreWrapperBE.js';
import {FirestoreInterface} from './FirestoreInterface.js';
import {firestore} from 'firebase-admin';
import {DocWrapper, UpdateObject} from './DocWrapper.js';
import {composeDbObjectUniqueId} from '@nu-art/firebase-shared';
import {_EmptyQuery, maxBatch} from '@nu-art/firebase-shared';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {addDeletedToTransaction, getActiveTransaction} from './consts.js';
import UpdateData = firestore.UpdateData;
import WriteBatch = firestore.WriteBatch;
import BulkWriter = firestore.BulkWriter;

// {deleted: null} means that the whole collection has been deleted
export type PostWriteProcessingData<DBType extends TS_Object> = {
	before?: DBType | DBType[];
	updated?: DBType | DBType[];
	deleted?: DBType | DBType[] | null;
};
export type CollectionActionType = 'create' | 'set' | 'update' | 'delete'
export type FirestoreCollectionHooks<DBType extends TS_Object> = {
	canDeleteItems: (dbItems: DBType[]) => Promise<void>,
	preWriteProcessing?: (dbInstance: DBType, originalDbInstance?: DBType) => Promise<void>,
	manipulateQuery?: (query: FirestoreQuery<DBType>) => FirestoreQuery<DBType>,
	postWriteProcessing?: (data: PostWriteProcessingData<DBType>, actionType: CollectionActionType) => Promise<void>,
	upgradeInstances: (instances: DBType[]) => Promise<any>
}

export type MultiWriteItem<Op extends MultiWriteOperation, DBType extends TS_Object> =
	Op extends 'delete' ? undefined :
		Op extends 'update' ? UpdateObject<DBType> :
			DBType;

type MultiWriteType = 'bulk' | 'batch';
const defaultMultiWriteType = 'batch';

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
 * If one of the validators is a function, returns an array of functions.
 * If both validators are objects, returns a merged object.
 */
const getDbDefValidator = <Proto extends DB_Prototype>(dbDef: Database<Proto>): [Proto['generatedPropsValidator'], Proto['modifiablePropsValidator']] | Proto['generatedPropsValidator'] & Proto['modifiablePropsValidator'] => {
	if (typeof dbDef.modifiablePropsValidator === 'object' && typeof dbDef.generatedPropsValidator === 'object')
		return {...dbDef.generatedPropsValidator, ...dbDef.modifiablePropsValidator, ...DB_Object_validator};

	if (typeof dbDef.modifiablePropsValidator === 'function' && typeof dbDef.generatedPropsValidator === 'function')
		return [dbDef.modifiablePropsValidator, dbDef.generatedPropsValidator] as [Proto['generatedPropsValidator'], Proto['modifiablePropsValidator']];

	if (typeof dbDef.modifiablePropsValidator === 'function')
		return [dbDef.modifiablePropsValidator, <T extends Proto['dbType']>(instance: T) => {
			const partialInstance = keepPartialObject(instance, _keys(dbDef.generatedPropsValidator));
			return tsValidateResult(partialInstance, dbDef.generatedPropsValidator);
		}] as Proto['generatedPropsValidator'] & Proto['modifiablePropsValidator'];

	return [dbDef.generatedPropsValidator, <T extends Proto['dbType']>(instance: T) => {
		return tsValidateResult(keepPartialObject(instance, _keys(dbDef.modifiablePropsValidator)), dbDef.modifiablePropsValidator);
	}] as [Proto['generatedPropsValidator'], Proto['modifiablePropsValidator']];
};

/**
 * FirestoreCollection is a class for handling Firestore collections.
 */
export class FirestoreCollection<Proto extends DB_Prototype>
	extends Logger {
	readonly wrapper: FirestoreWrapperBE;
	readonly collection: FirestoreType_Collection;
	readonly dbDef: Database<Proto>;
	readonly uniqueKeys: Proto['uniqueKeys'][] | string[];
	private readonly validator;
	readonly hooks?: FirestoreCollectionHooks<Proto['dbType']>;

	constructor(wrapper: FirestoreWrapperBE, _dbDef: Database<Proto>, hooks?: FirestoreCollectionHooks<Proto['dbType']>) {
		super();
		this.wrapper = wrapper;
		if (!/[a-z-]{3,}/.test(_dbDef.backend.name))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.collection = wrapper.firestore.collection(_dbDef.backend.name);
		this.dbDef = _dbDef;
		this.uniqueKeys = this.dbDef.uniqueKeys || Const_UniqueKeys;
		this.validator = getDbDefValidator(_dbDef);
		this.hooks = hooks;
	}

	doc = Object.freeze({
		_: (ref: FirestoreType_DocumentReference<Proto['dbType']>, data?: Proto['dbType']): DocWrapper<Proto> => {
			if (tsValidateResult(ref.id, tsValidateUniqueId)) throw new MUSTNeverHappenException(`Tackled a docRef with id that is an invalid UniqueId: '${ref.id}'`);
			// @ts-ignore
			return new DocWrapper(this, ref, data);
		},
		unique: (id: Proto['uniqueParam']) => {
			if (!id)
				throw new MUSTNeverHappenException('Did not receive an _id at doc.unique!');

			let idStr: string;
			if (typeof id !== 'string')
				idStr = assertUniqueId<Proto>(id, this.uniqueKeys) as string;
			else
				idStr = id;

			const doc = this.wrapper.firestore.doc(`${this.collection.path}/${idStr}`) as FirestoreType_DocumentReference<Proto['dbType']>;
			return this.doc._(doc);
		},
		item: (item: Proto['uiType']) => {
			item._id = assertUniqueId<Proto>(item, this.uniqueKeys);
			return this.doc.unique(item._id as Proto['uniqueParam']);
		},
		all: (_ids: (Proto['uniqueParam'])[]) => _ids.map(this.doc.unique),
		allItems: (preDBItems: Proto['uiType'][]) => {
			return preDBItems.map(preDBItem => this.doc.item(preDBItem));
		},
		query: async (query: FirestoreQuery<Proto['dbType']>) => {
			return (await this._customQuery(query, true)).map(_snapshot => this.doc._(_snapshot.ref, _snapshot.data()));
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>) => {
			return (await this._customQuery(query, false)).map(_snapshot => this.doc._(_snapshot.ref, _snapshot.data()));
		},
	});

	private getAll = async (docs: DocWrapper<Proto>[]): Promise<(Proto['dbType'] | undefined)[]> => {
		if (docs.length === 0)
			return [];

		const transaction = getActiveTransaction();
		return (await (transaction ?? this.wrapper.firestore).getAll(...docs.map(_doc => _doc.ref))).map(_snapshot => _snapshot.data() as Proto['dbType'] | undefined);
	};

	private _customQuery = async (tsQuery: FirestoreQuery<Proto['dbType']>, canManipulateQuery: boolean): Promise<FirestoreType_DocumentSnapshot<Proto['dbType']>[]> => {
		if (canManipulateQuery)
			tsQuery = this.hooks?.manipulateQuery?.(deepClone(tsQuery)) ?? tsQuery;

		const firestoreQuery = FirestoreInterface.buildQuery<Proto>(this, tsQuery);
		const transaction = getActiveTransaction();
		if (transaction)
			return (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<Proto['dbType']>[];

		return (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<Proto['dbType']>[];
	};

	query = Object.freeze({
		unique: async (_id: Proto['uniqueParam']) => await this.doc.unique(_id).get(),
		uniqueAssert: async (_id: Proto['uniqueParam']): Promise<Proto['dbType']> => {
			const resultItem = await this.query.unique(_id);
			if (!resultItem)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with _id: ${__stringify(_id)}`);

			return resultItem;
		},
		uniqueWhere: async (where: Clause_Where<Proto['dbType']>) => this.query.uniqueCustom({where}),
		uniqueCustom: async (query: FirestoreQuery<Proto['dbType']>) => {
			const thisShouldBeOnlyOne = await this.query.custom(query);
			if (thisShouldBeOnlyOne.length === 0)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with unique query: ${JSON.stringify(query)}`);

			if (thisShouldBeOnlyOne.length > 1)
				throw new BadImplementationException(`Too many results (${thisShouldBeOnlyOne.length}) in collection (${this.dbDef.dbKey}) for query: ${__stringify(query)}`);

			return thisShouldBeOnlyOne[0];
		},
		all: async (_ids: (Proto['uniqueParam'])[]) => await this.getAll(this.doc.all(_ids)),
		custom: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return (await this._customQuery(query, true)).map(snapshot => snapshot.data());
		},
		where: async (where: Clause_Where<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return this.query.custom({where});
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return (await this._customQuery(query, false)).map(snapshot => snapshot.data());
		},
	});

	uniqueGetOrCreate = async (where: Clause_Where<Proto['dbType']>, toCreate: () => Promise<Proto['uiType']>) => {
		try {
			return await this.query.uniqueWhere(where);
		} catch (e: any) {
			return toCreate();
		}
	};

	protected _createAll = async (preDBItems: Proto['uiType'][], multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Proto['dbType'][]> => {
		if (preDBItems.length === 1)
			return [await this.create.item(preDBItems[0])];

		const transaction = getActiveTransaction();
		const docs = this.doc.allItems(preDBItems);
		const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForCreate(preDBItems[i])));
		this.assertNoDuplicatedIds(dbItems, 'create.all');

		if (transaction)
			docs.forEach((doc, i) => transaction.create(doc.ref, dbItems[i]));
		else
			await this.multiWrite(multiWriteType, docs, 'create', dbItems);

		await this.hooks?.postWriteProcessing?.({updated: dbItems}, 'create');
		return dbItems;
	};

	create = Object.freeze({
		item: async (preDBItem: Proto['uiType']): Promise<Proto['dbType']> => await this.doc.item(preDBItem)
			.create(preDBItem),
		all: this._createAll,
	});

	private _setAll = async (items: (Proto['uiType'] | Proto['dbType'])[], multiWriteType: MultiWriteType = defaultMultiWriteType, performUpgrade = true) => {
		const transaction = getActiveTransaction();
		const docs = this.doc.allItems(items);
		const dbItems = await this.getAll(docs);
		const preparedItems = await Promise.all(dbItems.map(async (_dbItem, i) => {
			return !exists(_dbItem)
				? await docs[i].prepareForCreate(items[i], performUpgrade)
				: await docs[i].prepareForSet(items[i] as Proto['dbType'], _dbItem!, performUpgrade);
		}));
		this.assertNoDuplicatedIds(preparedItems, 'set.all');
		if (transaction)
			docs.map((doc, i) => transaction.set(doc.ref, preparedItems[i]));
		else
			await this.multiWrite(multiWriteType, docs, 'set', preparedItems);

		if (preparedItems.length)
			await this.hooks?.postWriteProcessing?.({before: dbItems, updated: preparedItems}, 'set');

		return preparedItems;
	};

	set = Object.freeze({
		item: async (preDBItem: Proto['uiType']) => {
			return await this.doc.item(preDBItem).set(preDBItem);
		},
		all: (items: (Proto['uiType'] | Proto['dbType'])[]) => {
			if (getActiveTransaction())
				return this._setAll(items);

			return this.runTransactionInChunks(items, (chunk) => this._setAll(chunk));
		},
		/**
		 * Multi is a non atomic operation
		 */
		multi: (items: (Proto['uiType'] | Proto['dbType'])[], multiWriteType: MultiWriteType = defaultMultiWriteType) => {
			return this._setAll(items, multiWriteType);
		},
	});

	// @ts-ignore
	private upgradeInstances = (items: (Proto['uiType'] | Proto['dbType'])[]) => {
		return this._setAll(items, defaultMultiWriteType, false);
	};

	protected _updateAll = async (updateData: UpdateObject<Proto['dbType']>[], multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Proto['dbType'][]> => {
		const docs = this.doc.all(updateData.map(_data => _data._id));
		const toUpdate: UpdateObject<Proto['dbType']>[] = await Promise.all(docs.map(async (_doc, i) => await _doc.prepareForUpdate(updateData[i])));
		await this.multiWrite(multiWriteType, docs, 'update', toUpdate);
		const dbItems = await this.getAll(docs) as Proto['dbType'][];
		await this.hooks?.postWriteProcessing?.({updated: dbItems}, 'update');
		return dbItems;
	};

	async validateUpdateData(updateData: UpdateData<Proto['dbType']>) {
	}

	// update = Object.freeze({
	// 	item: (updateData: UpdateObject<Proto['dbType']>) => this.doc.unique(updateData._id).update(updateData),
	// 	all: this._updateAll,
	// });

	protected _deleteQuery = async (query: FirestoreQuery<Proto['dbType']>, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const docsToBeDeleted = await this.doc.query(query);
		const itemsToReturn = docsToBeDeleted.map(doc => doc.data!);
		await this._deleteAll(docsToBeDeleted, multiWriteType);
		return itemsToReturn;
	};

	protected _deleteUnManipulatedQuery = async (query: FirestoreQuery<Proto['dbType']>, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const docsToBeDeleted = await this.doc.unManipulatedQuery(query);
		const itemsToReturn = docsToBeDeleted.map(doc => doc.data!);
		await this._deleteAll(docsToBeDeleted, multiWriteType);
		return itemsToReturn;
	};

	protected _deleteAll = async (docsToBeDeleted: DocWrapper<Proto>[], multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		const transaction = getActiveTransaction();
		const dbItems = filterInstances(await this.getAll(docsToBeDeleted));
		const itemsToCheck = dbItems.filter((item, index) => docsToBeDeleted[index].ref.id == item._id);
		addDeletedToTransaction({
			dbKey: this.dbDef.dbKey,
			ids: dbItems.map(dbObjectToId)
		});
		await this.hooks?.canDeleteItems(itemsToCheck);
		if (transaction)
			docsToBeDeleted.map(async doc => transaction.delete(doc.ref));
		else
			await this.multiWrite(multiWriteType, docsToBeDeleted, 'delete');

		await this.hooks?.postWriteProcessing?.({deleted: dbItems}, 'delete');
		return dbItems;
	};

	private deleteCollection = async () => {
		const refs = await this.collection.listDocuments();
		const bulk = this.wrapper.firestore.bulkWriter();
		refs.forEach(_ref => bulk.delete(_ref));
		// deleted: null means that the whole collection has been deleted
		await this.hooks?.postWriteProcessing?.({deleted: null}, 'delete');
		await bulk.close();
	};

	delete = Object.freeze({
		unique: async (id: Proto['uniqueParam']) => await this.doc.unique(id).delete(),
		item: async (item: Proto['uiType']) => await this.doc.item(item).delete(),
		all: async (ids: (Proto['uniqueParam'])[]): Promise<Proto['dbType'][]> => {
			if (!getActiveTransaction())
				return this.runTransactionInChunks(ids, (chunk) => this.delete.all(chunk));

			return this._deleteAll(ids.map(id => this.doc.unique(id)));
		},
		allDocs: async (docs: DocWrapper<Proto>[]): Promise<Proto['dbType'][]> => {
			if (!getActiveTransaction())
				return this.runTransactionInChunks(docs, (chunk) => this.delete.allDocs(chunk));

			return await this._deleteAll(docs);
		},
		allItems: async (items: Proto['uiType'][]): Promise<Proto['dbType'][]> => {
			if (!getActiveTransaction())
				return this.runTransactionInChunks(items, (chunk) => this.delete.allItems(chunk));

			return await this._deleteAll(items.map(_item => this.doc.item(_item)));
		},
		query: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			if (!getActiveTransaction()) {
				if (!exists(query) || compare(query, _EmptyQuery))
					throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

				const docs = await this.doc.query(query);
				const items = docs.map(doc => doc.data!);
				await this.runTransactionInChunks(docs, (chunk) => this._deleteAll(chunk));
				return items;
			}

			return await this._deleteQuery(query);
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			if (!getActiveTransaction()) {
				if (!exists(query) || compare(query, _EmptyQuery))
					throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

				const docs = await this.doc.unManipulatedQuery(query);
				const items = docs.map(doc => doc.data!);
				await this.runTransactionInChunks(docs, (chunk) => this._deleteAll(chunk));
				return items;
			}

			return await this._deleteUnManipulatedQuery(query);
		},
		where: async (where: Clause_Where<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return this.delete.query({where});
		},

		/**
		 * Multi is a non atomic operation — doesn't use transactions. Use 'all' variants for transaction.
		 */
		multi: {
			all: async (ids: UniqueId[], multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteAll(ids.map(id => this.doc.unique(id as Proto['uniqueParam'])), multiWriteType),
			items: async (items: Proto['uiType'][], multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteAll(items.map(_item => this.doc.item(_item)), multiWriteType),
			allDocs: async (docs: DocWrapper<Proto>[], multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Proto['dbType'][]> => await this._deleteAll(docs, multiWriteType),
			query: async (query: FirestoreQuery<Proto['dbType']>, multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteQuery(query, multiWriteType)
		},
		yes: {iam: {sure: {iwant: {todelete: {the: {collection: {delete: this.deleteCollection}}}}}}}
	});

	/**
	 * @param writer Type of BulkWriter - can be Bulk writer or Batch writer
	 * @param doc
	 * @param operation create/update/set/delete
	 * @param item - mandatory for everything but delete
	 */
	private addToMultiWrite = <Op extends MultiWriteOperation>(writer: BulkWriter | WriteBatch, doc: DocWrapper<Proto>, operation: Op, item?: MultiWriteItem<Op, Proto['dbType']>) => {
		switch (operation) {
			case 'create':
				writer.create(doc.ref, item as MultiWriteItem<'create', Proto['dbType']>);
				break;
			case 'set':
				// @ts-ignore
				writer.set(doc.ref, item as MultiWriteItem<'set', Proto>);
				break;
			case 'update':
				// @ts-ignore
				writer.update(doc.ref, item as MultiWriteItem<'update', Proto>);
				break;
			case 'delete':
				writer.delete(doc.ref);
				break;
		}
		return item;
	};

	private multiWrite = async <Op extends MultiWriteOperation>(type: MultiWriteType, docs: DocWrapper<Proto>[], operation: Op, items?: MultiWriteItem<Op, Proto['dbType']>[]) => {
		if (type === 'bulk')
			return this.bulkWrite(docs, operation, items);

		if (type === 'batch')
			return this.batchWrite(docs, operation, items);

		throw new Exception(`Unknown type passed to multiWrite: ${type}`);
	};

	private bulkWrite = async <Op extends MultiWriteOperation>(docs: DocWrapper<Proto>[], operation: Op, items?: MultiWriteItem<Op, Proto['dbType']>[]) => {
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

	/**
	 * @param docs docs to write to
	 * @param operation create/update/set/delete
	 * @param items mandatory for everything but delete
	 */
	private batchWrite = async <Op extends MultiWriteOperation>(docs: DocWrapper<Proto>[], operation: Op, items?: MultiWriteItem<Op, Proto['dbType']>[]) => {
		for (let batchIndex = 0; batchIndex < docs.length; batchIndex += maxBatch) {
			const batch = this.wrapper.firestore.batch();
			const chunk = docs.slice(batchIndex, batchIndex + maxBatch);
			chunk.map((_doc, index) => this.addToMultiWrite(batch, _doc, operation, items?.[batchIndex + index]));

			await batch.commit();
		}
	};


	/**
	 * Runs the processor within a Firestore transaction scope. If already inside a transaction
	 * (detected via MemKey), the existing transaction is reused. Otherwise a new one is created.
	 */
	runTransaction = async <ReturnType>(processor: () => Promise<ReturnType>): Promise<ReturnType> => {
		return this.wrapper.runTransaction<ReturnType>(processor);
	};

	runTransactionInChunks = async <T = any, R = any>(items: T[], processor: (chunk: typeof items) => Promise<R[]>, chunkSize: number = maxBatch): Promise<R[]> => {
		return batchActionParallel(items, chunkSize, (chunk) => this.runTransaction(() => processor(chunk)));
	};

	getVersion = () => {
		return this.dbDef.versions?.[0] || DefaultDBVersion;
	};

	needsUpgrade = (version?: string) => {
		const versions = this.dbDef.versions as string[] || [DefaultDBVersion];
		if (!version)
			return false;

		const index = versions.indexOf(version);
		if (index === -1)
			throw HttpCodes._4XX.BAD_REQUEST('Invalid Object Version', `Provided item with version(${version}) which doesn't exist for collection '${this.dbDef.dbKey} (${__stringify(this.dbDef.versions)})' `);

		return index !== 0;
	};

	validateItem(dbItem: Proto['dbType']) {
		const results = tsValidateResult(dbItem, this.validator as ValidatorTypeResolver<Proto['dbType']>);
		if (results) {
			this.onValidationError(dbItem, results as InvalidResult<Proto['dbType']>);
		}
	}

	protected onValidationError(instance: Proto['dbType'], results: InvalidResult<Proto['dbType']>) {
		StaticLogger.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		// console.error(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		// const errorBody = {type: 'bad-input', body: {result: results, input: instance}};
		const validationException = new ValidationException(`error validating ${this.dbDef.entityName}`, instance, results);
		throw new ApiException(HttpCodes._4XX.FAILED_VALIDATION.code, `error validating ${this.dbDef.entityName}`).setErrorBody(validationException as any);
	}

	private assertNoDuplicatedIds(items: Proto['dbType'][], originFunctionName: string) {
		if (filterDuplicates(items, dbObjectToId).length === items.length)
			return;

		const idCountMap: TypedMap<number> = items.reduce<TypedMap<number>>((countMap, item) => {
			// Count the number of appearances of each _id
			countMap[item._id] = !exists(countMap[item._id]) ? 1 : 1 + countMap[item._id];
			return countMap;
		}, {});

		// DEBUG - print the duplicate _ids
		// _keys(idCountMap).forEach(key => {
		// 	if (idCountMap[key] > 1)
		// 		this.logWarning(`${idCountMap[key]} times ${key}`);
		// });

		// Throw exception if an _id appears more than once
		_keys(idCountMap).forEach(key => {
			if (idCountMap[key] === 1)
				delete idCountMap[key];
		});

		throw new BadImplementationException(`${originFunctionName} received the same _id twice: ${__stringify(idCountMap, true)}`);
	}

	composeDbObjectUniqueId = (item: Proto['uiType']) => {
		return composeDbObjectUniqueId(item, this.uniqueKeys);
	};
}

/**
 * If the collection has unique keys, assert they exist, and use them to generate the _id.
 * In the case an _id already exists, verify it is not different from the uniqueKeys-generated _id.
 */
export const assertUniqueId = <Proto extends DB_Prototype>(item: Proto['dbType'], keys: Proto['uniqueKeys']): Proto['dbType']['_id'] => {
	// If there are no specific uniqueKeys, generate a random _id.
	if (compare(keys, Const_UniqueKeys as Proto['uniqueKeys']))
		return (item._id ?? generateHex(dbIdLength)) as Proto['dbType']['_id'];

	const _id = composeDbObjectUniqueId(item, keys) as Proto['dbType']['_id'];
	// If the item has an _id, and it matches the uniqueKeys-generated _id, all is well.
	// If the uniqueKeys-generated _id doesn't match the existing _id, this means someone had changed the uniqueKeys or _id which must never happen.
	if (exists(item._id) && _id !== item._id)
		throw new MUSTNeverHappenException(`When checking the existing _id, it did not match the _id composed from the unique keys! \n expected: ${_id} \n actual: ${item._id}`);

	return _id;
};