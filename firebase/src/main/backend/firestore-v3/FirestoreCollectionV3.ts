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
	batchActionParallel,
	compare,
	Const_UniqueKeys,
	CustomException,
	DB_Object_validator,
	DBDef_V3,
	dbIdLength,
	dbObjectToId,
	DBProto,
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
	tsValidateResult,
	tsValidateUniqueId,
	TypedMap,
	UniqueId,
	ValidationException,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentReference, FirestoreType_DocumentSnapshot} from '../firestore/types';
import {Clause_Where, FirestoreQuery, MultiWriteOperation} from '../../shared/types';
import {FirestoreWrapperBEV3} from './FirestoreWrapperBEV3';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV3} from './FirestoreInterfaceV3';
import {firestore} from 'firebase-admin';
import {DocWrapperV3, UpdateObject} from './DocWrapperV3';
import {composeDbObjectUniqueId} from '../../shared/utils';
import {_EmptyQuery, maxBatch} from '../../shared/consts';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {addDeletedToTransaction} from './consts';
import UpdateData = firestore.UpdateData;
import WriteBatch = firestore.WriteBatch;
import BulkWriter = firestore.BulkWriter;

// {deleted: null} means that the whole collection has been deleted
export type PostWriteProcessingData<Proto extends DBProto<any>> = {
	before?: Proto['dbType'] | Proto['dbType'][];
	updated?: Proto['dbType'] | Proto['dbType'][];
	deleted?: Proto['dbType'] | Proto['dbType'][] | null;
};
export type CollectionActionType = 'create' | 'set' | 'update' | 'delete'
export type FirestoreCollectionHooks<Proto extends DBProto<any>> = {
	canDeleteItems: (dbItems: Proto['dbType'][], transaction?: Transaction) => Promise<void>,
	preWriteProcessing?: (dbInstance: Proto['dbType'], originalDbInstance?: Proto['dbType'], transaction?: Transaction) => Promise<void>,
	manipulateQuery?: (query: FirestoreQuery<Proto['dbType']>) => FirestoreQuery<Proto['dbType']>,
	postWriteProcessing?: (data: PostWriteProcessingData<Proto>, actionType: CollectionActionType, transaction?: Transaction) => Promise<void>,
	upgradeInstances: (instances: Proto['dbType'][]) => Promise<any>
}

export type MultiWriteItem<Op extends MultiWriteOperation, Proto extends DBProto<any>> =
	Op extends 'delete' ? undefined :
		Op extends 'update' ? UpdateObject<Proto['dbType']> :
			Proto;

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
const getDbDefValidator = <Proto extends DBProto<any>>(dbDef: DBDef_V3<Proto>): [Proto['generatedPropsValidator'], Proto['modifiablePropsValidator']] | Proto['generatedPropsValidator'] & Proto['modifiablePropsValidator'] => {
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
export class FirestoreCollectionV3<Proto extends DBProto<any>>
	extends Logger {
	readonly wrapper: FirestoreWrapperBEV3;
	readonly collection: FirestoreType_Collection;
	readonly dbDef: DBDef_V3<Proto>;
	readonly uniqueKeys: Proto['uniqueKeys'][] | string[];
	private readonly validator;
	readonly hooks?: FirestoreCollectionHooks<Proto['dbType']>;

	constructor(wrapper: FirestoreWrapperBEV3, _dbDef: DBDef_V3<Proto>, hooks?: FirestoreCollectionHooks<Proto['dbType']>) {
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

	// ############################## DocWrapper ##############################
	doc = Object.freeze({
		_: (ref: FirestoreType_DocumentReference<Proto['dbType']>, data?: Proto['dbType']): DocWrapperV3<Proto> => {
			if (tsValidateResult(ref.id, tsValidateUniqueId)) throw new MUSTNeverHappenException(`Tackled a docRef with id that is an invalid UniqueId: '${ref.id}'`);
			// @ts-ignore
			return new DocWrapperV3(this, ref, data);
		},
		unique: (id: Proto['uniqueParam']) => {
			if (!id)
				throw new MUSTNeverHappenException('Did not receive an _id at doc.unique!');

			if (typeof id !== 'string')
				id = assertUniqueId<Proto>(id, this.uniqueKeys);

			const doc = this.wrapper.firestore.doc(`${this.collection.path}/${id}`) as FirestoreType_DocumentReference<Proto['dbType']>;
			return this.doc._(doc);
		},
		item: (item: Proto['uiType']) => {
			item._id = assertUniqueId<Proto>(item, this.uniqueKeys);
			return this.doc.unique(item._id!);
		},
		all: (_ids: (Proto['uniqueParam'])[]) => _ids.map(this.doc.unique),
		allItems: (preDBItems: Proto['uiType'][]) => {
			// At this point all preDB MUST have ids
			return preDBItems.map(preDBItem => this.doc.item(preDBItem));
		},
		query: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction) => {
			return (await this._customQuery(query, true, transaction)).map(_snapshot => this.doc._(_snapshot.ref, _snapshot.data()));
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction) => {
			return (await this._customQuery(query, false, transaction)).map(_snapshot => this.doc._(_snapshot.ref, _snapshot.data()));
		},
	});

	// ############################## Query ##############################
	private getAll = async (docs: DocWrapperV3<Proto>[], transaction?: Transaction): Promise<(Proto['dbType'] | undefined)[]> => {
		if (docs.length === 0)
			return [];

		return (await (transaction ?? this.wrapper.firestore).getAll(...docs.map(_doc => _doc.ref))).map(_snapshot => _snapshot.data() as Proto['dbType'] | undefined);
	};

	private _customQuery = async (tsQuery: FirestoreQuery<Proto['dbType']>, canManipulateQuery: boolean, transaction?: Transaction): Promise<FirestoreType_DocumentSnapshot<Proto['dbType']>[]> => {
		if (canManipulateQuery)
			tsQuery = this.hooks?.manipulateQuery?.(deepClone(tsQuery)) ?? tsQuery;

		this.logDebug(this.dbDef.dbKey, tsQuery);
		const firestoreQuery = FirestoreInterfaceV3.buildQuery<Proto>(this, tsQuery);
		if (transaction)
			return (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<Proto['dbType']>[];

		return (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<Proto['dbType']>[];
	};

	query = Object.freeze({
		unique: async (_id: Proto['uniqueParam'], transaction?: Transaction) => await this.doc.unique(_id).get(transaction),
		uniqueAssert: async (_id: Proto['uniqueParam'], transaction?: Transaction): Promise<Proto['dbType']> => {
			const resultItem = await this.query.unique(_id, transaction);
			if (!resultItem)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with _id: ${__stringify(_id)}`);

			return resultItem;
		},
		uniqueWhere: async (where: Clause_Where<Proto['dbType']>, transaction?: Transaction) => this.query.uniqueCustom({where}, transaction),
		uniqueCustom: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction) => {
			const thisShouldBeOnlyOne = await this.query.custom(query, transaction);
			if (thisShouldBeOnlyOne.length === 0)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with unique query: ${JSON.stringify(query)}`);

			if (thisShouldBeOnlyOne.length > 1)
				throw new BadImplementationException(`Too many results (${thisShouldBeOnlyOne.length}) in collection (${this.dbDef.dbKey}) for query: ${__stringify(query)}`);

			return thisShouldBeOnlyOne[0];
		},
		all: async (_ids: (Proto['uniqueParam'])[], transaction?: Transaction) => await this.getAll(this.doc.all(_ids), transaction),
		custom: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction): Promise<Proto['dbType'][]> => {
			return (await this._customQuery(query, true, transaction)).map(snapshot => snapshot.data());
		},
		where: async (where: Clause_Where<Proto['dbType']>, transaction?: Transaction): Promise<Proto['dbType'][]> => {
			return this.query.custom({where}, transaction);
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction): Promise<Proto['dbType'][]> => {
			return (await this._customQuery(query, false, transaction)).map(snapshot => snapshot.data());
		},
	});

	uniqueGetOrCreate = async (where: Clause_Where<Proto['dbType']>, toCreate: (transaction?: Transaction) => Promise<Proto['uiType']>, transaction?: Transaction) => {
		try {
			return await this.query.uniqueWhere(where, transaction);
		} catch (e: any) {
			return toCreate(transaction);
		}
	};

// ############################## Create ##############################
	protected _createAll = async (preDBItems: Proto['uiType'][], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Proto['dbType'][]> => {
		if (preDBItems.length === 1)
			return [await this.create.item(preDBItems[0], transaction)];

		const docs = this.doc.allItems(preDBItems);
		const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForCreate(preDBItems[i], transaction)));
		this.assertNoDuplicatedIds(dbItems, 'create.all');

		if (transaction)
			docs.forEach((doc, i) => transaction.create(doc.ref, dbItems[i]));
		else
			await this.multiWrite(multiWriteType, docs, 'create', dbItems);

		await this.hooks?.postWriteProcessing?.({updated: dbItems}, 'create');
		return dbItems;
	};

	create = Object.freeze({
		item: async (preDBItem: Proto['uiType'], transaction?: Transaction): Promise<Proto['dbType']> => await this.doc.item(preDBItem)
			.create(preDBItem, transaction),
		all: this._createAll,
	});

	// ############################## Set ##############################
	private _setAll = async (items: (Proto['uiType'] | Proto['dbType'])[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType, performUpgrade = true) => {
		//Get all items
		const docs = this.doc.allItems(items);
		const dbItems = await this.getAll(docs);
		//Prepare all items
		const preparedItems = await Promise.all(dbItems.map(async (_dbItem, i) => {
			return !exists(_dbItem) ? await docs[i].prepareForCreate(items[i], transaction, performUpgrade) : await docs[i].prepareForSet(items[i] as Proto['dbType'], _dbItem!, transaction, performUpgrade);
		}));
		this.assertNoDuplicatedIds(preparedItems, 'set.all');
		//Write all items
		if (transaction)
			// here we do not call doc.set because we have performed all the preparation for the dbitems as a group of items before this call
			docs.map((doc, i) => transaction.set(doc.ref, preparedItems[i]));
		else
			await this.multiWrite(multiWriteType, docs, 'set', preparedItems);
		//postWriteProcessing if provided
		await this.hooks?.postWriteProcessing?.({before: dbItems, updated: preparedItems}, 'set');
		return preparedItems;
	};

	set = Object.freeze({
		item: async (preDBItem: Proto['uiType'], transaction?: Transaction) => await this.doc.item(preDBItem).set(preDBItem, transaction),
		all: (items: (Proto['uiType'] | Proto['dbType'])[], transaction?: Transaction) => {
			if (transaction)
				return this._setAll(items, transaction);

			return this.runTransactionInChunks(items, (chunk, transaction) => this._setAll(chunk, transaction));
		},
		/**
		 * Multi is a non atomic operation
		 */
		multi: (items: (Proto['uiType'] | Proto['dbType'])[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
			return this._setAll(items, transaction, multiWriteType);
		},
	});

	// @ts-ignore
	private upgradeInstances = (items: (Proto['uiType'] | Proto['dbType'])[]) => {
		return this._setAll(items, undefined, defaultMultiWriteType, false);
	};

	// ############################## Update ##############################
	protected _updateAll = async (updateData: UpdateObject<Proto['dbType']>[], multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Proto['dbType'][]> => {
		const docs = this.doc.all(updateData.map(_data => _data._id));
		const toUpdate: UpdateObject<Proto['dbType']>[] = await Promise.all(docs.map(async (_doc, i) => await _doc.prepareForUpdate(updateData[i])));
		await this.multiWrite(multiWriteType, docs, 'update', toUpdate);
		const dbItems = await this.getAll(docs) as Proto['dbType'][];
		await this.hooks?.postWriteProcessing?.({updated: dbItems}, 'update');
		return dbItems;
	};

	async validateUpdateData(updateData: UpdateData<Proto['dbType']>, transaction?: Transaction) {
	}

	// update = Object.freeze({
	// 	item: (updateData: UpdateObject<Proto['dbType']>) => this.doc.unique(updateData._id).update(updateData),
	// 	all: this._updateAll,
	// });

	// ############################## Delete ##############################
	protected _deleteQuery = async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const docsToBeDeleted = await this.doc.query(query, transaction);
		// Because we query for docs, these docs and their data must exist in Firestore.
		const itemsToReturn = docsToBeDeleted.map(doc => doc.data!); // Data must exist here.
		await this._deleteAll(docsToBeDeleted, transaction, multiWriteType);
		return itemsToReturn;
	};

	protected _deleteUnManipulatedQuery = async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		const docsToBeDeleted = await this.doc.unManipulatedQuery(query, transaction);
		// Because we query for docs, these docs and their data must exist in Firestore.
		const itemsToReturn = docsToBeDeleted.map(doc => doc.data!); // Data must exist here.
		await this._deleteAll(docsToBeDeleted, transaction, multiWriteType);
		return itemsToReturn;
	};

	protected _deleteAll = async (docsToBeDeleted: DocWrapperV3<Proto>[], transaction?: Transaction, multiWriteType: MultiWriteType = defaultMultiWriteType) => {
		const dbItems = filterInstances(await this.getAll(docsToBeDeleted, transaction));
		const itemsToCheck = dbItems.filter((item, index) => docsToBeDeleted[index].ref.id == item._id);
		addDeletedToTransaction(transaction, {
			dbKey: this.dbDef.dbKey,
			ids: dbItems.map(dbObjectToId)
		});
		await this.hooks?.canDeleteItems(itemsToCheck, transaction);
		if (transaction)
			// here we do not call doc.delete because we have performed all the delete preparation as a group of items before this call
			docsToBeDeleted.map(async doc => transaction.delete(doc.ref));
		else
			await this.multiWrite(multiWriteType, docsToBeDeleted, 'delete');

		await this.hooks?.postWriteProcessing?.({deleted: dbItems}, 'delete', transaction);
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
		unique: async (id: Proto['uniqueParam'], transaction?: Transaction) => await this.doc.unique(id).delete(transaction),
		item: async (item: Proto['uiType'], transaction?: Transaction) => await this.doc.item(item).delete(transaction),
		all: async (ids: (Proto['uniqueParam'])[], transaction?: Transaction): Promise<Proto['dbType'][]> => {
			if (!transaction)
				return this.runTransactionInChunks(ids, (chunk, t) => this.delete.all(chunk, t));

			return this._deleteAll(ids.map(id => this.doc.unique(id)), transaction);
		},
		allDocs: async (docs: DocWrapperV3<Proto>[], transaction?: Transaction): Promise<Proto['dbType'][]> => {
			if (!transaction)
				return this.runTransactionInChunks(docs, (chunk, t) => this.delete.allDocs(chunk, t));

			return await this._deleteAll(docs, transaction);
		},
		allItems: async (items: Proto['uiType'][], transaction?: Transaction): Promise<Proto['dbType'][]> => {
			if (!transaction)
				return this.runTransactionInChunks(items, (chunk, t) => this.delete.allItems(chunk, t));

			return await this._deleteAll(items.map(_item => this.doc.item(_item)), transaction);
		},
		query: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction): Promise<Proto['dbType'][]> => {
			if (!transaction) {
				//query all docs and then delete in chunks
				if (!exists(query) || compare(query, _EmptyQuery))
					throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

				const docs = await this.doc.query(query, transaction);
				const items = docs.map(doc => doc.data!); // Data must exist here.
				await this.runTransactionInChunks(docs, (chunk, t) => this._deleteAll(chunk, t));
				return items;
			}

			return await this._deleteQuery(query, transaction);
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>, transaction?: Transaction): Promise<Proto['dbType'][]> => {
			if (!transaction) {
				//query all docs and then delete in chunks
				if (!exists(query) || compare(query, _EmptyQuery))
					throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

				const docs = await this.doc.unManipulatedQuery(query, transaction);
				const items = docs.map(doc => doc.data!); // Data must exist here.
				await this.runTransactionInChunks(docs, (chunk, t) => this._deleteAll(chunk, t));
				return items;
			}

			return await this._deleteUnManipulatedQuery(query, transaction);
		},
		where: async (where: Clause_Where<Proto['dbType']>, transaction?: Transaction): Promise<Proto['dbType'][]> => {
			return this.delete.query({where}, transaction);
		},

		/**
		 * Multi is a non atomic operation - doesn't use transactions. Use 'all' variants for transaction.
		 */
		multi: {
			all: async (ids: UniqueId[], multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteAll(ids.map(id => this.doc.unique(id)), undefined, multiWriteType),
			items: async (items: Proto['uiType'][], multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteAll(items.map(_item => this.doc.item(_item)), undefined, multiWriteType),
			allDocs: async (docs: DocWrapperV3<Proto>[], multiWriteType: MultiWriteType = defaultMultiWriteType): Promise<Proto['dbType'][]> => await this._deleteAll(docs, undefined, multiWriteType),
			query: async (query: FirestoreQuery<Proto['dbType']>, multiWriteType: MultiWriteType = defaultMultiWriteType) => await this._deleteQuery(query, undefined, multiWriteType)
		},
		yes: {iam: {sure: {iwant: {todelete: {the: {collection: {delete: this.deleteCollection}}}}}}}
	});

	// ############################## Multi Write ##############################
	/**
	 * @param writer Type of BulkWriter - can be Bulk writer or Batch writer
	 * @param doc
	 * @param operation create/update/set/delete
	 * @param item - mandatory for everything but delete
	 */
	private addToMultiWrite = <Op extends MultiWriteOperation>(writer: BulkWriter | WriteBatch, doc: DocWrapperV3<Proto>, operation: Op, item?: MultiWriteItem<Op, Proto['dbType']>) => {
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

	private multiWrite = async <Op extends MultiWriteOperation>(type: MultiWriteType, docs: DocWrapperV3<Proto>[], operation: Op, items?: MultiWriteItem<Op, Proto['dbType']>[]) => {
		if (type === 'bulk')
			return this.bulkWrite(docs, operation, items);

		if (type === 'batch')
			return this.batchWrite(docs, operation, items);

		throw new Exception(`Unknown type passed to multiWrite: ${type}`);
	};

	private bulkWrite = async <Op extends MultiWriteOperation>(docs: DocWrapperV3<Proto>[], operation: Op, items?: MultiWriteItem<Op, Proto['dbType']>[]) => {
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
	private batchWrite = async <Op extends MultiWriteOperation>(docs: DocWrapperV3<Proto>[], operation: Op, items?: MultiWriteItem<Op, Proto['dbType']>[]) => {
		for (let batchIndex = 0; batchIndex < docs.length; batchIndex += maxBatch) {
			const batch = this.wrapper.firestore.batch();
			const chunk = docs.slice(batchIndex, batchIndex + maxBatch);
			chunk.map((_doc, index) => this.addToMultiWrite(batch, _doc, operation, items?.[batchIndex + index]));

			await batch.commit();
		}
	};

	// ############################## General ##############################

	/**
	 * A firestore transaction is run globally on the firestore project and not specifically on any collection, locking specific documents in the project.
	 * @param processor
	 * @param transaction A transaction that was provided to be used
	 */
	runTransaction = async <ReturnType>(processor: (transaction: Transaction) => Promise<ReturnType>, transaction?: Transaction): Promise<ReturnType> => {
		return this.wrapper.runTransaction<ReturnType>(processor, transaction);
	};

	runTransactionInChunks = async <T = any, R = any>(items: T[], processor: (chunk: typeof items, transaction: Transaction) => Promise<R[]>, chunkSize: number = maxBatch): Promise<R[]> => {
		return batchActionParallel(items, chunkSize, (chunk) => this.runTransaction(t => processor(chunk, t)));
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
export const assertUniqueId = <Proto extends DBProto<any>>(item: Proto['dbType'], keys: Proto['uniqueKeys']) => {
	// If there are no specific uniqueKeys, generate a random _id.
	if (compare(keys, Const_UniqueKeys as Proto['uniqueKeys']))
		return item._id ?? generateHex(dbIdLength);

	const _id = composeDbObjectUniqueId(item, keys);
	// If the item has an _id, and it matches the uniqueKeys-generated _id, all is well.
	// If the uniqueKeys-generated _id doesn't match the existing _id, this means someone had changed the uniqueKeys or _id which must never happen.
	if (exists(item._id) && _id !== item._id)
		throw new MUSTNeverHappenException(`When checking the existing _id, it did not match the _id composed from the unique keys! \n expected: ${_id} \n actual: ${item._id}`);

	return _id;
};