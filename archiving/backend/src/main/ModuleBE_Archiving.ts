/*
 * @nu-art/archiving-backend - Archiving backend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	BadImplementationException,
	batchActionParallel,
	currentTimeMillis,
	Day,
	DB_Object,
	dbIdLength,
	deepClone,
	generateHex,
	Hour,
	Module,
	removeDBObjectKeys
} from '@nu-art/ts-common';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import type {ModuleBE_BaseDB, PostWriteProcessingDataShape} from '@nu-art/db-api-backend';
import type {DB_Prototype} from '@nu-art/db-api-shared';
import {ApiHandler} from '@nu-art/http-server';
import {ApiDef_Archiving, type ApiStruct_Archiving} from '@nu-art/archiving-shared';
import {_EmptyQuery} from '@nu-art/firebase-shared';

export const Const_ArchivedCollectionPath = '--archived';

type MongoRow = {
	_id: string;
	[key: string]: unknown;
};

type AnyBaseDB = ModuleBE_BaseDB<DB_Prototype>;
type NamedDef = { dbKey: string; backend?: { name: string } };

const rows = <T>(value: T | T[] | null | undefined): T[] => {
	if (value == null)
		return [];
	return Array.isArray(value) ? value : [value];
};

const liveCollectionName = (dbModule: AnyBaseDB): string => {
	const def: NamedDef = dbModule.dbDef;
	return def.backend?.name ?? def.dbKey;
};

/**
 * Archives prior versions of registered collections in Mongo.
 * Apps register DB modules via registerModule(). Routes are registered via @ApiHandler.
 */
export class ModuleBE_ArchiveModule_Class
	extends Module {

	private readonly TTL: number;
	private readonly lastUpdatedTTL: number;
	protected readonly moduleMapper: Record<string, AnyBaseDB> = {};

	constructor() {
		super();
		this.lastUpdatedTTL = Day;
		this.TTL = Hour * 2;
	}

	/**
	 * Register a DB module for archiving. Call for each collection that should support archiving.
	 */
	readonly registerModule = (collectionPath: string, dbModule: AnyBaseDB) => {
		this.moduleMapper[collectionPath] = dbModule;
		dbModule.registerPostWriteInterceptor(async (data) => {
			await this.onWrite(dbModule, data);
		});
	};

	@ApiHandler(ApiDef_Archiving.vv1.hardDeleteUnique)
	async hardDeleteUnique(body: ApiStruct_Archiving['vv1']['hardDeleteUnique']['Body']) {
		const {_id, collectionName, dbInstance} = body;
		const dbModule = this.moduleMapper[collectionName];

		if (!dbModule)
			throw new BadImplementationException('no module found');

		return dbModule.runTransaction(async () => {
			const instance = dbInstance ?? await dbModule.query.unique({_id});

			if (!instance)
				throw new BadImplementationException(`couldn't find doc with id ${_id}`);

			(instance as DB_Object & { __hardDelete?: boolean }).__hardDelete = true;
			await dbModule.set.item(instance);
		});
	}

	@ApiHandler(ApiDef_Archiving.vv1.hardDeleteAll)
	async hardDeleteAll(queryParams: ApiStruct_Archiving['vv1']['hardDeleteAll']['Params']) {
		const dbModule = this.moduleMapper[queryParams.collectionName];

		if (!dbModule)
			throw new BadImplementationException('no module found');

		const collectionItems = await dbModule.query.custom(_EmptyQuery);
		await batchActionParallel(collectionItems, 10, (chunk) => Promise.all(chunk.map((item) => this.hardDeleteUnique({
			_id: item._id,
			collectionName: queryParams.collectionName,
			dbInstance: item
		}))));
	}

	@ApiHandler(ApiDef_Archiving.vv1.getDocumentHistory)
	async getDocumentHistory(queryParams: ApiStruct_Archiving['vv1']['getDocumentHistory']['Params']): Promise<ApiStruct_Archiving['vv1']['getDocumentHistory']['Response']> {
		const {collectionName, _id} = queryParams;
		const dbModule = this.moduleMapper[collectionName];

		if (!dbModule)
			throw new BadImplementationException('no db module found');

		const archived = await this.archiveCollection(dbModule.dbDef.dbKey);
		const docs = await archived.find({_originDocId: _id}).sort({__created: -1}).toArray();
		return docs.filter(doc => !doc.__collectionName) as DB_Object[];
	}

	private async mongoDb() {
		return ModuleBE_Firebase.createAdminSession().getMongo('default').readyDb();
	}

	private async archiveCollection(dbKey: string) {
		const db = await this.mongoDb();
		return db.collection<MongoRow>(`${dbKey}${Const_ArchivedCollectionPath}`);
	}

	private async onWrite(dbModule: AnyBaseDB, data: PostWriteProcessingDataShape<DB_Object>) {
		for (const before of rows(data.deleted))
			await this.insertToArchive(dbModule, before);

		const befores = rows(data.before);
		for (const after of rows(data.updated)) {
			const before = befores.find(item => item._id === after._id);
			if (!before)
				continue;
			await this.processUpdate(dbModule, before, after);
		}
	}

	private checkTTL(instance: DB_Object, dbModule: AnyBaseDB): boolean {
		const timestamp = currentTimeMillis();
		const TTL = dbModule.dbDef.TTL ?? this.TTL;

		if (TTL === -1 || !instance.__updated)
			return false;

		return timestamp > (instance.__updated + TTL);
	}

	private checkLastUpdatedTTL(instance: DB_Object, dbModule: AnyBaseDB): boolean {
		const timestamp = currentTimeMillis();
		const lastUpdatedTTL = dbModule.dbDef.lastUpdatedTTL ?? this.lastUpdatedTTL;

		if (lastUpdatedTTL === -1 || !instance.__updated)
			return false;

		return timestamp > (instance.__updated + lastUpdatedTTL);
	}

	private async insertToArchive(dbModule: AnyBaseDB, before: DB_Object) {
		if ((before as DB_Object & { __hardDelete?: boolean }).__hardDelete)
			return;

		const timestamp = currentTimeMillis();
		let dbInstance = deepClone(before) as DB_Object & { _originDocId?: string };
		dbInstance = removeDBObjectKeys(dbInstance) as DB_Object & { _originDocId?: string };
		dbInstance._originDocId = before._id;
		dbInstance._id = generateHex(dbIdLength);
		dbInstance.__updated = timestamp;
		dbInstance.__created = timestamp;

		const archived = await this.archiveCollection(dbModule.dbDef.dbKey);
		await archived.insertOne(dbInstance as MongoRow);
	}

	private async processUpdate(dbModule: AnyBaseDB, before: DB_Object, after: DB_Object) {
		const afterObj = after as DB_Object & { __hardDelete?: boolean };
		if (afterObj.__hardDelete)
			return this.hardDeleteDoc(before, dbModule);

		if (this.checkTTL(before, dbModule) || this.checkLastUpdatedTTL(before, dbModule))
			return this.insertToArchive(dbModule, before);
	}

	private async hardDeleteDoc(instance: DB_Object, dbModule: AnyBaseDB) {
		const db = await this.mongoDb();
		const archived = await this.archiveCollection(dbModule.dbDef.dbKey);
		await db.collection<MongoRow>(liveCollectionName(dbModule)).deleteOne({_id: instance._id});
		await archived.deleteMany({_originDocId: instance._id});
	}
}

export const ModuleBE_Archiving = new ModuleBE_ArchiveModule_Class();
