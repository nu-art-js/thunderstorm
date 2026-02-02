/*
 * @nu-art/db-api-backend - Test-only minimal BaseDB concrete class + mock wiring
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_keys} from '@nu-art/ts-common';
import type {FirestoreCollectionV3} from '@nu-art/firebase-backend/firestore-v3/FirestoreCollectionV3';
import type {BaseDBDefBE} from '../main/backend-types.js';
import type {BaseDBApiConfig} from '../main/ModuleBE_BaseDB.js';
import {ModuleBE_BaseDB} from '../main/ModuleBE_BaseDB.js';

const TEST_DB_DEF: BaseDBDefBE = {
	dbKey: 'test-entity',
	entityName: 'TestEntity',
	versions: ['v1']
};

/** Minimal concrete class so we can instantiate ModuleBE_BaseDB (abstract). Name ends with _Class for Module rule. */
export class TestModuleBE_BaseDB_Class extends ModuleBE_BaseDB<any> {
	constructor(dbDef: BaseDBDefBE = TEST_DB_DEF, appConfig?: BaseDBApiConfig) {
		super(dbDef, appConfig ?? {chunksSize: 200});
	}
}

/**
 * Replaces the Firestore collection on a BaseDB instance with a mock and wires query/set/delete/doc/runTransaction.
 * Call this instead of db.init() when testing with a mock collection.
 */
export function wireMockCollection(db: ModuleBE_BaseDB<any>, mock: FirestoreCollectionV3<any>): void {
	(db as any).collection = mock;
	db.runTransaction = mock.runTransaction;

	type Callable = { [K: string]: ((p: any) => Promise<any> | any) | Callable };
	const wrapInTryCatch = <T extends Callable>(input: T, path?: string): T => _keys(input).reduce((acc: any, key: keyof T) => {
		const value = input[key];
		const newPath = path ? `${path}.${String(key)}` : String(key);
		if (typeof value === 'function') {
			acc[key] = (async (...args: any[]) => {
				try {
					return await (value as Function)(...args);
				} catch (e: any) {
					db.logError(`Error while calling "${newPath}"`);
					throw e;
				}
			});
			return acc;
		}
		if (typeof value === 'object' && value !== null)
			acc[key] = wrapInTryCatch(value, newPath);
		else
			acc[key] = value;
		return acc;
	}, {} as T);

	db.query = wrapInTryCatch(mock.query, 'query');
	db.create = wrapInTryCatch(mock.create, 'create');
	db.set = wrapInTryCatch(mock.set, 'set');
	db.delete = wrapInTryCatch(mock.delete, 'delete');
	db.doc = wrapInTryCatch(mock.doc, 'doc');
}
