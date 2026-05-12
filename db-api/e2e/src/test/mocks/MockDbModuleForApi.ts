/*
 * @nu-art/db-api-e2e-tests - Test-only BaseDB subclass with mock collection (E2E tests only)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Mirrors db-api-backend test helper for E2E isolation.
 */

import type {FirestoreCollection} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import type {BaseDBApiConfig, BaseDBDefBE} from '@nu-art/db-api-backend';
import {createMockFirestoreCollectionV3} from './MockFirestoreCollectionV3.js';

const DEFAULT_DB_KEY = 'test-entity';

const DEFAULT_DB_DEF: BaseDBDefBE = {
	dbKey: DEFAULT_DB_KEY,
	entityName: 'TestEntity',
	versions: ['v1']
};

export class MockModuleBE_BaseDB_Class
	extends ModuleBE_BaseDB<any> {
	mockCollection: FirestoreCollection<any>;

	constructor(
		dbDef: BaseDBDefBE = DEFAULT_DB_DEF,
		mockCollection: FirestoreCollection<any>,
		appConfig?: BaseDBApiConfig,
	) {
		super(dbDef, appConfig ?? {chunksSize: 200});
		this.mockCollection = mockCollection;
	}

	resolveCollection() {
		this.collection = this.mockCollection;
	}
}

export function createMockDbModuleForApi(
	mockCollection: FirestoreCollection<any> = createMockFirestoreCollectionV3(),
	dbKey: string                              = DEFAULT_DB_KEY
): MockModuleBE_BaseDB_Class {
	const dbDef: BaseDBDefBE = {
		dbKey,
		entityName: 'TestEntity',
		versions: ['v1']
	};
	const db = new MockModuleBE_BaseDB_Class(dbDef, mockCollection, {chunksSize: 200});
	db.init();
	return db;
}
