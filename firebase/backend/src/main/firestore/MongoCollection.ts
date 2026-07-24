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

import {Database, dbObjectToId, DB_Prototype, EntityNotFoundException, EntityOutdatedException, InvalidEntityVersionException} from '@nu-art/db-api-shared';
import {
	__stringify,
	_keys,
	asArray,
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
import {addDeletedToTransaction, getActiveTransaction, markTransactionWrite, MemKey_FirestoreTransaction} from './consts.js';
import {MongoInterface} from './MongoInterface.js';
import {FirestoreCollectionHooks} from './FirestoreCollection.js';
import type {ClientSession, Collection as MongoDriverCollection, Db as MongoDriverDb, UpdateFilter} from 'mongodb';
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
	readonly uniqueKeys: Proto['uniqueKeys'];
	private readonly validator;
	readonly hooks?: FirestoreCollectionHooks<Proto['dbType']>;
	private lastKnownCount = 0;

	constructor(db: MongoDriverDb, _dbDef: Database<Proto>, hooks?: FirestoreCollectionHooks<Proto['dbType']>) {
		super();
		this.db = db;
		if (!/[a-z-]{3,}/.test(_dbDef.backend.name))
			StaticLogger.logWarning('Please follow name pattern for collections /[a-z-]{3,}/');

		this.mongoCollection = db.collection<Proto['dbType']>(_dbDef.backend.name);
		this.dbDef = _dbDef;
		this.uniqueKeys = (this.dbDef.uniqueKeys || Const_UniqueKeys) as Proto['uniqueKeys'];
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
			if (txState === 'TRANSACTION_COMMITTED' || txState === 'TRANSACTION_ABORTED')
				this.logWarning(`SESSION-STALE [${this.dbDef.dbKey}] txState=${txState}`);

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
		this.logDebug(`_customQuery [${this.dbDef.dbKey}] filter=${__stringify(compiled.filter)} manipulated=${canManipulateQuery}`);
		let cursor = this.mongoCollection.find(compiled.filter, this.sessionOpts());

		if (compiled.sort)
			cursor = cursor.sort(compiled.sort);

		if (compiled.projection)
			cursor = cursor.project(compiled.projection);

		if (compiled.skip)
			cursor = cursor.skip(compiled.skip);

		if (compiled.limit)
			cursor = cursor.limit(compiled.limit);

		const results = await cursor.toArray() as Proto['dbType'][];
		if (results.length > this.lastKnownCount)
			this.lastKnownCount = results.length;

		if (results.length === 0 && this.lastKnownCount > 0 && Object.keys(compiled.filter).length > 0)
			this.logWarning(`_customQuery [${this.dbDef.dbKey}] returned 0 results but collection previously had ${this.lastKnownCount} items — filter=${__stringify(compiled.filter)}`);

		this.logDebug(`_customQuery [${this.dbDef.dbKey}] results=${results.length} ids=${results.map(r => r._id).join(',')}`);
		return results;
	}

	query = Object.freeze({
		unique: async (_id: Proto['uniqueParam']): Promise<Proto['dbType'] | undefined> => {
			const idStr = typeof _id !== 'string' ? this.assertUniqueId(_id) : _id;
			const results = await this._customQuery({where: {_id: idStr} as Clause_Where<Proto['dbType']>}, true);
			this.logDebug(`query.unique [${this.dbDef.dbKey}] _id=${idStr} found=${!!results.length}`);
			return results[0];
		},
		/**
		 * Read-by-id that bypasses the query interceptors (no __access enforcement).
		 * Sanctioned internal use only: original-loads for write/delete and self-loads
		 * that cannot pass through an access filter. Mirrors FirestoreCollection for type parity.
		 */
		uniqueUnmanipulated: async (_id: Proto['uniqueParam']): Promise<Proto['dbType'] | undefined> => {
			const idStr = typeof _id !== 'string' ? this.assertUniqueId(_id) : _id;
			const result = await this.mongoCollection.findOne({_id: idStr} as any, this.sessionOpts());
			return result as Proto['dbType'] | undefined;
		},
		uniqueAssert: async (_id: Proto['uniqueParam']): Promise<Proto['dbType']> => {
			const result = await this.query.unique(_id);
			if (!result)
				throw new EntityNotFoundException(`Could not find ${this.dbDef.entityName} with _id: ${__stringify(_id)}`);

			return result;
		},
		uniqueWhere: async (where: Clause_Where<Proto['dbType']>) => this.query.uniqueCustom({where}),
		uniqueCustom: async (query: FirestoreQuery<Proto['dbType']>) => {
			const results = await this.query.custom(query);
			if (results.length === 0)
				throw new EntityNotFoundException(`Could not find ${this.dbDef.entityName} with unique query: ${JSON.stringify(query)}`);

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
		/**
		 * Bypasses query interceptors (including document __access enforcement).
		 * Do not use unless explicitly approved — prefer service-account permission context
		 * with normal query APIs so access rules still apply.
		 */
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
			markTransactionWrite();
			this.logDebug(`create.item [${this.dbDef.dbKey}] _id=${dbItem._id}`);
			const result = await this.mongoCollection.insertOne(dbItem as any, this.sessionOpts());
			this.logDebug(`create.item [${this.dbDef.dbKey}] acknowledged=${result.acknowledged} insertedId=${result.insertedId}`);
			await this.hooks?.postWriteProcessing?.({updated: dbItem}, 'create');
			return dbItem;
		},
		all: async (preDBItems: Proto['uiType'][]): Promise<Proto['dbType'][]> => {
			if (preDBItems.length === 1)
				return [await this.create.item(preDBItems[0])];

			const dbItems = await Promise.all(preDBItems.map(item => this.prepareForCreate(item)));
			this.assertNoDuplicatedIds(dbItems, 'create.all');
			markTransactionWrite();
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
			// original-load must see the true record regardless of caller read-access:
			// write authorization is governed by the pre-write interceptor (writers/owners),
			// and a readers-filtered load would hide an existing doc and allow a create-branch overwrite.
			const currDBItem = await this.query.uniqueUnmanipulated(preDBItem._id as Proto['uniqueParam']);

			if ((currDBItem?.__updated || 0) > ((preDBItem as DB_Object).__updated || currentTimeMillis()))
				throw new EntityOutdatedException(`Item is outdated: ${this.dbDef.backend.name}/${currDBItem?._id}`);

			const dbItem = await this.prepareForSet(preDBItem as Proto['dbType'], currDBItem, false);
			markTransactionWrite();
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

	/**
	 * Persist instances already upgraded by {@link ModuleBE_BaseDB.upgradeCollection}.
	 * Mirrors FirestoreCollection.upgradeInstances — callable via ts-ignore from db-api.
	 * Loads existing rows unmanipulated so access filters do not drop docs mid-migrate.
	 */
	// @ts-ignore — invoked from ModuleBE_BaseDB.upgradeCollection (same pattern as FirestoreCollection)
	private upgradeInstances = async (items: (Proto['uiType'] | Proto['dbType'])[]): Promise<Proto['dbType'][]> => {
		if (this.getSession())
			return this._setAll(items, false, true);

		return this.runTransactionInChunks(items, (chunk) => this._setAll(chunk, false, true));
	};

	private _setAll = async (
		items: (Proto['uiType'] | Proto['dbType'])[],
		performUpgrade = true,
		unmanipulatedExisting = false,
	): Promise<Proto['dbType'][]> => {
		const ids = items.map(item => {
			(item as any)._id = this.assertUniqueId(item);
			return (item as any)._id as string;
		});
		const existingItems = filterInstances(
			unmanipulatedExisting
				? await Promise.all(ids.map(id => this.query.uniqueUnmanipulated(id as Proto['uniqueParam'])))
				: await this.query.all(ids as Proto['uniqueParam'][]),
		);
		const existingMap = new Map(existingItems.map(item => [item._id, item]));

		const preparedItems = await Promise.all(items.map(async (item) => {
			const existing = existingMap.get((item as any)._id);
			return !exists(existing)
				? await this.prepareForCreate(item, performUpgrade)
				: await this.prepareForSet(item as Proto['dbType'], existing!, performUpgrade);
		}));

		this.assertNoDuplicatedIds(preparedItems, 'set.all');

		const ops = preparedItems.map(item => ({
			replaceOne: {
				filter: {_id: item._id},
				replacement: item,
				upsert: true,
			}
		}));

		markTransactionWrite();
		await this.mongoCollection.bulkWrite(ops as any[], this.sessionOpts());
		if (preparedItems.length)
			await this.hooks?.postWriteProcessing?.({before: existingItems, updated: preparedItems}, 'set');

		return preparedItems;
	};

	/** Access-asserted partial update — Mongo update operators only (e.g. `$inc`, `$set`). */
	update = Object.freeze({
		item: async (_id: Proto['uniqueParam'], operators: UpdateFilter<Proto['dbType']>): Promise<Proto['dbType']> => {
			const session = this.getSession();
			if (!session)
				return this.runTransaction(() => this.update.item(_id, operators), 'update.item');

			const idStr = typeof _id !== 'string' ? this.assertUniqueId(_id as Proto['uiType']) : _id;
			const currDBItem = await this.query.uniqueUnmanipulated(_id);
			if (!currDBItem)
				throw new EntityNotFoundException(`Could not find ${this.dbDef.entityName} with _id: ${__stringify(_id)}`);

			const uiItem = deepClone(currDBItem) as Proto['uiType'];
			await this.hooks?.preWriteProcessing?.(uiItem, currDBItem);

			const now = currentTimeMillis();
			const mergedOperators = {
				...operators,
				$set: {
					...(operators.$set as Record<string, unknown> | undefined),
					__updated: now,
					_v: this.getVersion(),
				},
			} as UpdateFilter<Proto['dbType']>;

			markTransactionWrite();
			this.logDebug(`update.item [${this.dbDef.dbKey}] _id=${idStr}`);
			const updated = await this.mongoCollection.findOneAndUpdate(
				{_id: idStr} as any,
				mergedOperators,
				{returnDocument: 'after', ...this.sessionOpts()},
			) as Proto['dbType'] | null;

			if (!updated)
				throw new EntityNotFoundException(`Could not find ${this.dbDef.entityName} with _id: ${__stringify(_id)} after update`);

			this.validateItem(updated);
			await this.hooks?.postWriteProcessing?.({before: currDBItem, updated}, 'update');
			return updated;
		},
	});

	ensureIndices = async (): Promise<void> => {
		const indices = this.dbDef.indices ?? [];
		for (const idx of indices) {
			const spec = asArray(idx.keys).reduce<Record<string, 1>>((acc, key) => {
				acc[String(key)] = 1;
				return acc;
			}, {});
			await this.mongoCollection.createIndex(spec, {
				name: idx.id,
				unique: idx.params?.unique ?? false,
			});
		}
	};

	private _deleteAll = async (ids: UniqueId[]): Promise<Proto['dbType'][]> => {
		const items = filterInstances(await this.query.all(ids as Proto['uniqueParam'][]));

		addDeletedToTransaction({
			dbKey: this.dbDef.dbKey,
			ids: items.map(dbObjectToId)
		});

		await this.hooks?.canDeleteItems(items);
		markTransactionWrite();
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

			// delete authorization is governed by the pre-delete interceptor (deleters/owners),
			// so the original-load is read-access-independent.
			const dbItem = await this.query.uniqueUnmanipulated(id);
			if (!dbItem)
				return;

			addDeletedToTransaction({dbKey: this.dbDef.entityName, ids: [dbItem._id]});
			await this.hooks?.canDeleteItems([dbItem]);
			markTransactionWrite();
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
				markTransactionWrite();
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
			const wrapper = {
				transaction: session as any,
				active: true,
				writeCount: 0,
				beginTransaction: () => session.startTransaction(),
			};
			const parentStorage = MemStorage.getStore();
			try {
				await new MemStorage().init(async () => {
					MemKey_FirestoreTransaction.set(wrapper);
					result = await processor();
				}, parentStorage);
			} catch (e) {
				wrapper.active = false;
				if (wrapper.writeCount > 0)
					await session.abortTransaction();

				throw e;
			}

			wrapper.active = false;
			if (wrapper.writeCount > 0)
				await session.commitTransaction();

			this.logDebug(`TX-END [${tag}] writes=${wrapper.writeCount}`);
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
			throw new InvalidEntityVersionException(`Provided item with version(${version}) which doesn't exist for collection '${this.dbDef.dbKey} (${__stringify(this.dbDef.versions)})' `);

		return index !== 0;
	};

	validateItem(dbItem: Proto['dbType']) {
		const results = tsValidateResult(dbItem, this.validator as ValidatorTypeResolver<Proto['dbType']>);
		if (results)
			this.onValidationError(dbItem, results as InvalidResult<Proto['dbType']>);
	}

	protected onValidationError(instance: Proto['dbType'], results: InvalidResult<Proto['dbType']>) {
		StaticLogger.logError(`error validating ${this.dbDef.entityName}:`, instance, 'With Error: ', results);
		throw new ValidationException(`error validating ${this.dbDef.entityName}`, instance, results);
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
