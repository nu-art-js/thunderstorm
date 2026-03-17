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
	removeDBObjectKeys
} from '@nu-art/ts-common';
import {ModuleBE_FirestoreListener} from '@nu-art/firebase-backend';
import type {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {DB_Prototype} from '@nu-art/db-api-shared';
import {DB_BaseObject} from '@nu-art/db-api-shared';
import {ApiHandler} from '@nu-art/http-server';
import {ApiDef_Archiving, type ApiStruct_Archiving} from '@nu-art/archiving-shared';
import {_EmptyQuery} from '@nu-art/firebase-shared';

type Params = { collectionName: string; docId: string };

export const Const_ArchivedCollectionPath = '/_archived';


type AnyBaseDB = ModuleBE_BaseDB<DB_Prototype>;

/**
 * Handles Firestore database operations with custom logic for archiving and Time-To-Live (TTL).
 * Apps must register DB modules via constructor or registerModule(); routes are registered via @ApiHandler.
 */
export class ModuleBE_ArchiveModule_Class
	extends ModuleBE_FirestoreListener<DB_BaseObject> {

	private readonly TTL: number;
	private readonly lastUpdatedTTL: number;
	protected readonly moduleMapper: Record<string, AnyBaseDB> = {};

	constructor() {
		super('{collectionName}');
		this.lastUpdatedTTL = Day;
		this.TTL = Hour * 2;
	}

	/**
	 * Register a DB module for archiving. Call for each collection that should support archiving.
	 */
	readonly registerModule = (collectionPath: string, dbModule: AnyBaseDB) => {
		this.moduleMapper[collectionPath] = dbModule;
	};

	protected init() {
		super.init();
	}

	@ApiHandler(ApiDef_Archiving.vv1.hardDeleteUnique)
	async hardDeleteUnique(body: ApiStruct_Archiving['vv1']['hardDeleteUnique']['Body']) {
		const {_id, collectionName, dbInstance} = body;
		const dbModule = this.moduleMapper[collectionName];

		if (!dbModule)
			throw new BadImplementationException('no module found');

		return dbModule.runTransaction(async (transaction) => {
			const instance = dbInstance ?? await dbModule.query.unique({_id}, transaction);

			if (!instance)
				throw new BadImplementationException(`couldn't find doc with id ${_id}`);

			(instance as DB_Object & { __hardDelete?: boolean }).__hardDelete = true;

			await dbModule.set.item(instance, transaction);
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
			collectionName: dbModule.collection.collection.path,
			dbInstance: item
		}))));
	}

	@ApiHandler(ApiDef_Archiving.vv1.getDocumentHistory)
	async getDocumentHistory(queryParams: ApiStruct_Archiving['vv1']['getDocumentHistory']['Params']): Promise<ApiStruct_Archiving['vv1']['getDocumentHistory']['Response']> {
		const {collectionName, _id} = queryParams;
		const dbModule = this.moduleMapper[collectionName];

		if (!dbModule)
			throw new BadImplementationException('no db module found');

		const collectionGroup = dbModule.collection.collection.firestore.collectionGroup('_archived');
		const query = collectionGroup.where('_originDocId', '==', _id).orderBy('__created', 'desc');
		const snapshot = await query.get();
		const docs = snapshot.docs.map((doc) => doc.data());

		return docs.filter((doc: Record<string, unknown>) => !doc.__collectionName) as DB_Object[];
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

		const collectionRef = dbModule.collection.collection;
		const timestamp = currentTimeMillis();

		let dbInstance = deepClone(before) as DB_Object & { _originDocId?: string };

		const subCollection = collectionRef.doc(dbInstance._id).collection(Const_ArchivedCollectionPath);

		dbInstance = removeDBObjectKeys(dbInstance) as DB_Object & { _originDocId?: string };
		dbInstance._originDocId = before._id;
		dbInstance._id = generateHex(dbIdLength);
		dbInstance.__updated = timestamp;
		dbInstance.__created = timestamp;

		await subCollection.doc(dbInstance._id).set(dbInstance);
	}

	private async hardDeleteDoc(instance: DB_Object, dbModule: AnyBaseDB) {
		const collectionRef = dbModule.collection.collection;
		const instanceRef = collectionRef.doc(instance._id);
		const archivedCollectionRef = instanceRef.collection(Const_ArchivedCollectionPath);

		const archivedDocs = await archivedCollectionRef.listDocuments();
		await instanceRef.delete();

		return batchActionParallel(archivedDocs, 10, (docChunk) => Promise.all(docChunk.map(async (doc) => {
			await doc.set({__hardDelete: true}, {merge: true});
			return doc.delete();
		})));
	}

	async processChanges(params: Params, before?: any, after?: any) {
		const dbModule = this.moduleMapper[params.collectionName];

		if (!dbModule)
			throw new BadImplementationException('no db module found');

		if (!before)
			return;

		if (!after)
			return this.insertToArchive(dbModule, before);

		const afterObj = after as DB_Object & { __hardDelete?: boolean };
		if (afterObj.__hardDelete)
			return this.hardDeleteDoc(before, dbModule);

		if (this.checkTTL(before, dbModule))
			return this.insertToArchive(dbModule, before);

		if (this.checkLastUpdatedTTL(before, dbModule))
			return this.insertToArchive(dbModule, before);
	}
}

export const ModuleBE_Archiving = new ModuleBE_ArchiveModule_Class();
