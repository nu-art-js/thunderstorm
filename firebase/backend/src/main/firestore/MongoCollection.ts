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
	currentTimeMillis,
	DB_Object,
	DB_Object_validator,
	dbIdLength,
	deepClone,
	DefaultDBVersion,
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
	TypedMap,
	UniqueId,
	ValidationException,
	ValidatorTypeResolver,
} from '@nu-art/ts-common';
import {Clause_Where, FirestoreQuery} from '@nu-art/firebase-shared';
import {composeDbObjectUniqueId, _EmptyQuery, maxBatch} from '@nu-art/firebase-shared';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {addDeletedToTransaction, getActiveTransaction, MemKey_FirestoreTransaction} from './consts.js';
import {MongoInterface} from './MongoInterface.js';
import {FirestoreCollectionHooks} from './FirestoreCollection.js';
import type {ClientSession, Collection as MongoDriverCollection, Db as MongoDriverDb} from 'mongodb';
import {MemStorage} from '@nu-art/ts-common/mem-storage';


const getDbDefValidator = <Proto extends DB_Prototype>(dbDef: Database<Proto>) => {
	if (typeof dbDef.modifiablePropsValidator === 'object' && typeof dbDef.generatedPropsValidator === 'object')
		return {...dbDef.generatedPropsValidator, ...dbDef.modifiablePropsValidator, ...DB_Object_validator};

	if (typeof dbDef.modifiablePropsValidator === 'function' && typeof dbDef.generatedPropsValidator === 'function')
		return [dbDef.modifiablePropsValidator, dbDef.generatedPropsValidator];

	if (typeof dbDef.modifiablePropsValidator === 'function')
		return [dbDef.modifiablePropsValidator, <T extends Proto['dbType']>(instance: T) => {
			const partialInstance = keepPartialObject(instance, _keys(dbDef.generatedPropsValidator));
			return tsValidateResult(partialInstance, dbDef.generatedPropsValidator);
		}];

	return [dbDef.generatedPropsValidator, <T extends Proto['dbType']>(instance: T) => {
		return tsValidateResult(keepPartialObject(instance, _keys(dbDef.modifiablePropsValidator)), dbDef.modifiablePropsValidator);
	}];
};

export class MongoCollection<Proto extends DB_Prototype>
	extends Logger {

	readonly db: MongoDriverDb;
	readonly mongoCollection: MongoDriverCollection<Proto['dbType']>;
	readonly dbDef: Database<Proto>;
	readonly uniqueKeys: Proto['uniqueKeys'][] | string[];
	private readonly validator;
	readonly hooks?: FirestoreCollectionHooks<Proto['dbType']>;

	constructor(db: MongoDriverDb, _dbDef: Database<Proto>, hooks?: FirestoreCollectionHooks<Proto['dbType']>) {
		super();
		this.db = db;
		if (!/[a-z-]{3,}/.test(_dbDef.backend.name))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.mongoCollection = db.collection<Proto['dbType']>(_dbDef.backend.name);
		this.dbDef = _dbDef;
		this.uniqueKeys = this.dbDef.uniqueKeys || Const_UniqueKeys;
		this.validator = getDbDefValidator(_dbDef);
		this.hooks = hooks;
	}

	private getSession(): ClientSession | undefined {
		const tx = getActiveTransaction();
		if (!tx)
			return undefined;

		if ('abortTransaction' in tx) {
			const session = tx as unknown as ClientSession;
			const txState = (session as any).transaction?.state;
			if (txState && txState !== 'TRANSACTION_IN_PROGRESS' && txState !== 'STARTING_TRANSACTION')
				this.logWarning(`SESSION-STALE [${this.dbDef.dbKey}] txState=${txState} — using session whose transaction is ${txState}`);

			return session;
		}

		return undefined;
	}

	private sessionOpts() {
		const session = this.getSession();
		return session ? {session} : {};
	}

	private assertUniqueId(item: Proto['uiType']): Proto['dbType']['_id'] {
		if (compare(this.uniqueKeys, Const_UniqueKeys as Proto['uniqueKeys']))
			return (item._id ?? generateHex(dbIdLength)) as Proto['dbType']['_id'];

		const _id = composeDbObjectUniqueId(item, this.uniqueKeys) as Proto['dbType']['_id'];
		if (exists(item._id) && _id !== item._id)
			throw new MUSTNeverHappenException(`Composed _id does not match existing _id! expected: ${_id}, actual: ${item._id}`);

		return _id;
	}

	private async _customQuery(tsQuery: FirestoreQuery<Proto['dbType']>, canManipulateQuery: boolean): Promise<Proto['dbType'][]> {
		if (canManipulateQuery)
			tsQuery = this.hooks?.manipulateQuery?.(deepClone(tsQuery)) ?? tsQuery;

		const compiled = MongoInterface.buildQuery<Proto['dbType']>(tsQuery);
		let cursor = this.mongoCollection.find(compiled.filter, this.sessionOpts());

		if (compiled.sort)
			cursor = cursor.sort(compiled.sort);

		if (compiled.projection)
			cursor = cursor.project(compiled.projection);

		if (compiled.skip)
			cursor = cursor.skip(compiled.skip);

		if (compiled.limit)
			cursor = cursor.limit(compiled.limit);

		return await cursor.toArray() as Proto['dbType'][];
	}

	query = Object.freeze({
		unique: async (_id: Proto['uniqueParam']): Promise<Proto['dbType'] | undefined> => {
			const idStr = typeof _id !== 'string' ? this.assertUniqueId(_id) : _id;
			const result = await this.mongoCollection.findOne({_id: idStr} as any, this.sessionOpts());
			return result as Proto['dbType'] | undefined;
		},
		uniqueAssert: async (_id: Proto['uniqueParam']): Promise<Proto['dbType']> => {
			const result = await this.query.unique(_id);
			if (!result)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with _id: ${__stringify(_id)}`);

			return result;
		},
		uniqueWhere: async (where: Clause_Where<Proto['dbType']>) => this.query.uniqueCustom({where}),
		uniqueCustom: async (query: FirestoreQuery<Proto['dbType']>) => {
			const results = await this.query.custom(query);
			if (results.length === 0)
				throw new ApiException(404, `Could not find ${this.dbDef.entityName} with unique query: ${JSON.stringify(query)}`);

			if (results.length > 1)
				throw new BadImplementationException(`Too many results (${results.length}) in collection (${this.dbDef.dbKey}) for query: ${__stringify(query)}`);

			return results[0];
		},
		all: async (_ids: (Proto['uniqueParam'])[]): Promise<(Proto['dbType'] | undefined)[]> => {
			const idStrs = _ids.map(id => typeof id !== 'string' ? this.assertUniqueId(id) : id);
			const results = await this.mongoCollection.find({_id: {$in: idStrs}} as any, this.sessionOpts()).toArray() as Proto['dbType'][];
			const resultMap = new Map(results.map(r => [r._id, r]));
			return idStrs.map(id => resultMap.get(id));
		},
		custom: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return this._customQuery(query, true);
		},
		where: async (where: Clause_Where<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return this.query.custom({where});
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return this._customQuery(query, false);
		},
	});

	uniqueGetOrCreate = async (where: Clause_Where<Proto['dbType']>, toCreate: () => Promise<Proto['uiType']>) => {
		try {
			return await this.query.uniqueWhere(where);
		} catch (e: any) {
			return toCreate();
		}
	};

	private prepareForCreate = async (item: Proto['uiType'], upgrade = true): Promise<Proto['dbType']> => {
		const now = currentTimeMillis();
		item._id = this.assertUniqueId(item);
		item.__updated = item.__created = now;
		if (upgrade) {
			item._v = this.getVersion();
			await this.hooks?.upgradeInstances([item]);
		}

		await this.hooks?.preWriteProcessing?.(item, undefined);
		this.validateItem(item as Proto['dbType']);
		return item as Proto['dbType'];
	};

	private prepareForSet = async (updatedItem: Proto['dbType'], dbItem?: Proto['dbType'], upgrade = true): Promise<Proto['dbType']> => {
		if (!dbItem)
			return this.prepareForCreate(updatedItem);

		updatedItem._id = this.assertUniqueId(updatedItem);
		updatedItem.__created = dbItem.__created;

		this.dbDef.lockKeys?.forEach(lockedKey => {
			if (exists(dbItem[lockedKey]))
				updatedItem[lockedKey] = dbItem[lockedKey];
		});

		updatedItem.__updated = currentTimeMillis();

		if (this.needsUpgrade(updatedItem._v))
			await this.hooks?.upgradeInstances([updatedItem]);

		updatedItem._v = this.getVersion();
		await this.hooks?.preWriteProcessing?.(updatedItem, dbItem);
		this.validateItem(updatedItem);
		return updatedItem;
	};

	create = Object.freeze({
		item: async (preDBItem: Proto['uiType']): Promise<Proto['dbType']> => {
			const dbItem = await this.prepareForCreate(preDBItem);
			await this.mongoCollection.insertOne(dbItem as any, this.sessionOpts());
			await this.hooks?.postWriteProcessing?.({updated: dbItem}, 'create');
			return dbItem;
		},
		all: async (preDBItems: Proto['uiType'][]): Promise<Proto['dbType'][]> => {
			if (preDBItems.length === 1)
				return [await this.create.item(preDBItems[0])];

			const dbItems = await Promise.all(preDBItems.map(item => this.prepareForCreate(item)));
			this.assertNoDuplicatedIds(dbItems, 'create.all');
			await this.mongoCollection.insertMany(dbItems as any[], this.sessionOpts());
			await this.hooks?.postWriteProcessing?.({updated: dbItems}, 'create');
			return dbItems;
		},
	});

	set = Object.freeze({
		item: async (preDBItem: Proto['uiType']): Promise<Proto['dbType']> => {
			const session = this.getSession();
			if (!session)
				return this.runTransaction(() => this.set.item(preDBItem), 'set.item');

			preDBItem._id = this.assertUniqueId(preDBItem);
			const currDBItem = await this.query.unique(preDBItem._id as Proto['uniqueParam']);

			if ((currDBItem?.__updated || 0) > ((preDBItem as DB_Object).__updated || currentTimeMillis()))
				throw HttpCodes._4XX.ENTITY_IS_OUTDATED('Item is outdated', `${this.dbDef.backend.name}/${currDBItem?._id} is outdated`);

			const dbItem = await this.prepareForSet(preDBItem as Proto['dbType'], currDBItem, false);
			await this.mongoCollection.replaceOne({_id: dbItem._id} as any, dbItem as any, {upsert: true, ...this.sessionOpts()});
			await this.hooks?.postWriteProcessing?.({before: currDBItem, updated: dbItem}, 'set');
			return dbItem;
		},
		all: async (items: (Proto['uiType'] | Proto['dbType'])[]): Promise<Proto['dbType'][]> => {
			if (this.getSession())
				return this._setAll(items);

			return this.runTransactionInChunks(items, (chunk) => this._setAll(chunk));
		},
		multi: async (items: (Proto['uiType'] | Proto['dbType'])[]): Promise<Proto['dbType'][]> => {
			return this._setAll(items);
		},
	});

	private _setAll = async (items: (Proto['uiType'] | Proto['dbType'])[]): Promise<Proto['dbType'][]> => {
		const ids = items.map(item => {
			(item as any)._id = this.assertUniqueId(item);
			return (item as any)._id as string;
		});
		const existingItems = await this.query.all(ids as Proto['uniqueParam'][]);
		const existingMap = new Map(filterInstances(existingItems).map(item => [item._id, item]));

		const preparedItems = await Promise.all(items.map(async (item) => {
			const existing = existingMap.get((item as any)._id);
			return !exists(existing)
				? await this.prepareForCreate(item)
				: await this.prepareForSet(item as Proto['dbType'], existing!);
		}));

		this.assertNoDuplicatedIds(preparedItems, 'set.all');

		const ops = preparedItems.map(item => ({
			replaceOne: {
				filter: {_id: item._id},
				replacement: item,
				upsert: true,
			}
		}));

		await this.mongoCollection.bulkWrite(ops as any[], this.sessionOpts());
		if (preparedItems.length)
			await this.hooks?.postWriteProcessing?.({before: existingItems, updated: preparedItems}, 'set');

		return preparedItems;
	};

	private _deleteAll = async (ids: UniqueId[]): Promise<Proto['dbType'][]> => {
		const items = filterInstances(await this.query.all(ids as Proto['uniqueParam'][]));

		addDeletedToTransaction({
			dbKey: this.dbDef.dbKey,
			ids: items.map(dbObjectToId)
		});

		await this.hooks?.canDeleteItems(items);
		await this.mongoCollection.deleteMany({_id: {$in: ids}} as any, this.sessionOpts());
		await this.hooks?.postWriteProcessing?.({deleted: items}, 'delete');
		return items;
	};

	delete = Object.freeze({
		unique: async (id: Proto['uniqueParam']): Promise<Proto['dbType'] | undefined> => {
			const idStr = typeof id !== 'string' ? this.assertUniqueId(id) : id;
			const session = this.getSession();
			if (!session)
				return this.runTransaction(() => this.delete.unique(id), 'delete.unique');

			const dbItem = await this.query.unique(id);
			if (!dbItem)
				return;

			addDeletedToTransaction({dbKey: this.dbDef.entityName, ids: [dbItem._id]});
			await this.hooks?.canDeleteItems([dbItem]);
			await this.mongoCollection.deleteOne({_id: idStr} as any, this.sessionOpts());
			await this.hooks?.postWriteProcessing?.({deleted: dbItem}, 'delete');
			return dbItem;
		},
		item: async (item: Proto['uiType']): Promise<Proto['dbType'] | undefined> => {
			item._id = this.assertUniqueId(item);
			return this.delete.unique(item._id as Proto['uniqueParam']);
		},
		all: async (ids: (Proto['uniqueParam'])[]): Promise<Proto['dbType'][]> => {
			const idStrs = ids.map(id => typeof id !== 'string' ? this.assertUniqueId(id) : id);
			if (!this.getSession())
				return this.runTransactionInChunks(idStrs, (chunk) => this._deleteAll(chunk));

			return this._deleteAll(idStrs);
		},
		allItems: async (items: Proto['uiType'][]): Promise<Proto['dbType'][]> => {
			const ids = items.map(item => {
				(item as any)._id = this.assertUniqueId(item);
				return (item as any)._id as string;
			});
			if (!this.getSession())
				return this.runTransactionInChunks(ids, (chunk) => this._deleteAll(chunk));

			return this._deleteAll(ids);
		},
		query: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			if (!exists(query) || compare(query, _EmptyQuery))
				throw new MUSTNeverHappenException('An empty query was passed to delete.query!');

			const items = await this.query.custom(query);
			const ids = filterInstances(items.map(dbObjectToId));
			if (!this.getSession()) {
				await this.runTransactionInChunks(ids, (chunk) => this._deleteAll(chunk));
				return items;
			}

			return this._deleteAll(ids);
		},
		allDocs: async (_docs: any[]): Promise<Proto['dbType'][]> => {
			const ids = _docs.map((d: any) => d._id || d.ref?.id).filter(Boolean);
			if (!this.getSession())
				return this.runTransactionInChunks(ids, (chunk) => this._deleteAll(chunk));

			return this._deleteAll(ids);
		},
		where: async (where: Clause_Where<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			return this.delete.query({where});
		},
		unManipulatedQuery: async (query: FirestoreQuery<Proto['dbType']>): Promise<Proto['dbType'][]> => {
			if (!exists(query) || compare(query, _EmptyQuery))
				throw new MUSTNeverHappenException('An empty query was passed to delete.unManipulatedQuery!');

			const items = await this._customQuery(query, false);
			const ids = filterInstances(items.map(dbObjectToId));
			if (!this.getSession()) {
				await this.runTransactionInChunks(ids, (chunk) => this._deleteAll(chunk));
				return items;
			}

			return this._deleteAll(ids);
		},
		multi: {
			all: async (ids: UniqueId[]) => this._deleteAll(ids),
			items: async (items: Proto['uiType'][]) => {
				const _ids = items.map(item => {
					(item as any)._id = this.assertUniqueId(item);
					return (item as any)._id as string;
				});
				return this._deleteAll(_ids);
			},
			allDocs: async (_docs: any[]): Promise<Proto['dbType'][]> => {
				const ids = _docs.map((d: any) => d._id || d.ref?.id).filter(Boolean);
				return this._deleteAll(ids);
			},
			query: async (query: FirestoreQuery<Proto['dbType']>) => {
				const items = await this.query.custom(query);
				const ids = filterInstances(items.map(dbObjectToId));
				return this._deleteAll(ids);
			}
		},
		yes: {iam: {sure: {iwant: {todelete: {the: {collection: {
			delete: async () => {
				await this.mongoCollection.deleteMany({}, this.sessionOpts());
				await this.hooks?.postWriteProcessing?.({deleted: null}, 'delete');
			}
		}}}}}}}
	});

	runTransaction = async <ReturnType>(processor: () => Promise<ReturnType>, label?: string): Promise<ReturnType> => {
		const existingSession = this.getSession();
		if (existingSession)
			return processor();

		const tag = label ? `${this.dbDef.dbKey}:${label}` : this.dbDef.dbKey;
		const client = this.db.client;
		const session = client.startSession();
		this.logDebug(`TX-START [${tag}]`);
		try {
			let result: ReturnType;
			const parentStorage = MemStorage.getStore();
			await session.withTransaction(async () => {
				await new MemStorage().init(async () => {
					MemKey_FirestoreTransaction.set({transaction: session as any, active: true});
					result = await processor();
				}, parentStorage);
			});
			this.logDebug(`TX-END [${tag}]`);
			return result!;
		} finally {
			await session.endSession();
		}
	};

	runTransactionInChunks = async <T = any, R = any>(items: T[], processor: (chunk: typeof items) => Promise<R[]>, chunkSize: number = maxBatch): Promise<R[]> => {
		return batchActionParallel(items, chunkSize, (chunk) => this.runTransaction(() => processor(chunk), `chunk(${chunk.length})`));
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
		if (results)
			this.onValidationError(dbItem, results as InvalidResult<Proto['dbType']>);
	}

	protected onValidationError(instance: Proto['dbType'], results: InvalidResult<Proto['dbType']>) {
		StaticLogger.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		const validationException = new ValidationException(`error validating ${this.dbDef.entityName}`, instance, results);
		throw new ApiException(HttpCodes._4XX.FAILED_VALIDATION.code, `error validating ${this.dbDef.entityName}`).setErrorBody(validationException as any);
	}

	private assertNoDuplicatedIds(items: Proto['dbType'][], originFunctionName: string) {
		if (filterDuplicates(items, dbObjectToId).length === items.length)
			return;

		const idCountMap: TypedMap<number> = items.reduce<TypedMap<number>>((countMap, item) => {
			countMap[item._id] = !exists(countMap[item._id]) ? 1 : 1 + countMap[item._id];
			return countMap;
		}, {});

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
