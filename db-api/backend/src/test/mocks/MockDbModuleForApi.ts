/*
 * @nu-art/db-api-backend - Test-only BaseDB subclass with overridden Firestore collection (tests only)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {FirestoreCollection} from '@nu-art/firebase-backend/firestore/FirestoreCollection';
import {ModuleBE_BaseDB} from '../../main/ModuleBE_BaseDB.js';
import type {BaseDBApiConfig, BaseDBDefBE} from '../../main/index.js';
import {createMockFirestoreCollectionV3} from './MockFirestoreCollectionV3.js';

const DEFAULT_DB_KEY = 'test-entity';

const DEFAULT_DB_DEF: BaseDBDefBE = {
	dbKey: DEFAULT_DB_KEY,
	entityName: 'TestEntity',
	versions: ['v1']
};

/**
 * Test-only concrete BaseDB that overrides init() to use a mock Firestore collection
 * instead of a real one. Pass the mock in the constructor; init() wires it like BaseDB does.
 */
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

/**
 * Creates a BaseDB instance backed by a mock Firestore collection for API tests.
 * Uses MockModuleBE_BaseDB_Class; call .init() before passing to ModuleBE_BaseApi_Class.
 */
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
