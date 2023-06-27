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
	Subset,
	tsValidateResult,
	UniqueId,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {FirestoreType_Collection, FirestoreType_DocumentReference, FirestoreType_DocumentSnapshot} from '../firestore/types';
import {Clause_Where, DB_EntityDependency, FirestoreQuery} from '../../shared/types';
import {FirestoreWrapperBEV2} from './FirestoreWrapperBEV2';
import {Transaction} from 'firebase-admin/firestore';
import {FirestoreInterfaceV2} from './FirestoreInterfaceV2';
import {firestore} from 'firebase-admin';
import {BulkItem, BulkOperation, DocWrapperV2, UpdateObject} from './DocWrapperV2';
import {canDeleteDispatcherV2} from './consts';
import UpdateData = firestore.UpdateData;

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

	private _customQuery = async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<FirestoreType_DocumentSnapshot<Type>[]> => {
		const myQuery = FirestoreInterfaceV2.buildQuery<Type>(this, query);
		if (transaction)
			return (await transaction.get(myQuery)).docs as FirestoreType_DocumentSnapshot<Type>[];

		return (await myQuery.get()).docs as FirestoreType_DocumentSnapshot<Type>[];
	};

	query = {
		unique: async (_id: UniqueId, transaction?: Transaction) => await this.doc.unique(_id).get(transaction),
		all: async (_ids: UniqueId[], transaction?: Transaction) => await this.getAll(this.doc.all(_ids), transaction),
		custom: async (query: FirestoreQuery<Type>, transaction?: Transaction): Promise<Type[]> => {
			return (await this._customQuery(query, transaction)).map(snapshot => snapshot.data());
		},
	};

	// ############################## Create ##############################
	create = {
		item: async (preDBItem: PreDB<Type>, transaction?: Transaction): Promise<Type> => {
			preDBItem._id ??= generateId();
			return await this.doc.item(preDBItem).create(preDBItem, transaction);
		},
		all: async (preDBItems: PreDB<Type>[], transaction?: Transaction): Promise<Type[]> => {
			preDBItems.forEach(preDBItem => preDBItem._id ??= generateId());
			const docs = this.doc.allItems(preDBItems);
			const dbItems = await Promise.all(docs.map((doc, i) => doc.prepareForCreate(preDBItems[i], transaction)));

			if (transaction)
				docs.forEach((doc, i) => transaction.create(doc.ref, dbItems[i]));
			else
				await this.bulkOperation(docs, 'create', dbItems);
			return dbItems;
		},
	};

	// ############################## Set ##############################
	protected _setAll = async (items: (PreDB<Type> | Type)[], transaction?: Transaction) => {
		const {filteredIn: hasIdItems, filteredOut: noIdItems} = filterInOut<PreDB<Type> | Type>(items, _item => exists(_item._id));
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
	}

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
		return await this.getAll(docs) as Type[]
	};

	async assertUpdateData(updateData: UpdateData<Type>, transaction?: Transaction) {
	}

	update = {
		item: (updateData: UpdateObject<Type>) => this.doc.unique(updateData._id).update(updateData),
		all: this._updateBulk,
	};

	// ############################## Delete ##############################
	protected async _deleteQuery(query: FirestoreQuery<Type>, transaction?: Transaction) {
		if (!exists(query) || compare(query, _EmptyQuery))
			throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

		await this._deleteAll(await this.doc.query(query, transaction), transaction);
	}

	protected async _deleteAll(docs: DocWrapperV2<Type>[], transaction?: Transaction) {
		const dbItems = filterInstances(await this.getAll(docs));
		await this.canDeleteDocument(dbItems, transaction);
		if (transaction)
			docs.forEach(doc => doc.delete(transaction));
		else
			await this.bulkOperation(docs, 'delete');
	}

	async deleteCollection() {
		const refs = await this.collection.listDocuments();
		const bulk = this.wrapper.firestore.bulkWriter();
		refs.forEach(_ref => bulk.delete(_ref));
		await bulk.close();
	}

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

		const errors: string[] = [];
		bulk.onWriteError(error => {
			errors.push(error.message);
			return false;
		});

		docs.forEach((doc, index) => doc.addToBulk(bulk, operation, items?.[index]));
		await bulk.close();

		if (errors.length)
			throw new FirestoreException(__stringify(errors));
	};

	/**
	 * A firestore transaction is run globally on the firestore project and not specifically on any collection, locking specific documents in the project.
	 * @param processor: A set of read and write operations on one or more documents.
	 */
	async runTransaction<ReturnType>(processor: (transaction: Transaction) => Promise<ReturnType>): Promise<ReturnType> {
		const firestore = this.wrapper.firestore;
		return firestore.runTransaction<ReturnType>(processor);
	}

	getVersion = () => {
		return this.dbDef.versions?.[0] || DefaultDBVersion;
	};

	async assertDBItem(dbItem: Type, transaction?: Transaction, request?: Express.Request) {
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
		// console.error(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		const errorBody = {type: 'bad-input', body: {result: results, input: instance}};
		throw new ApiException(400, `error validating ${this.dbDef.entityName}`).setErrorBody(errorBody as any);
	}

	private assertUniqueness(dbItem: Type, transaction?: Transaction, request?: Express.Request) {
	}

	/**
	 * Override this method to provide actions or assertions to be executed before the deletion happens.
	 * @param transaction - The transaction object
	 * @param dbItems - The DB entry that is going to be deleted.
	 */
	async canDeleteDocument(dbItems: Type[], transaction?: Transaction) {
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