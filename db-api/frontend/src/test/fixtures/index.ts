/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Shared test data and types for unit and Playwright tests.
 */

import {HttpMethod} from '@nu-art/http-client';
import {BaseDBConfig, CrudTypes} from '../../main/types.js';
import {CrudApiDefShape} from '../../main/decorators/types.js';
import {DB_Object, DBConfig} from '../../main/to-refactor/db-types.js';


/** Minimal test entity: DB_Object plus a name field. */
export type DB_TestItem = DB_Object & {
	name: string;
};

/** UI input type for tests (excludes generated DB_Object fields for creation/update). */
export type UI_TestItem = Pick<DB_TestItem, '_id' | 'name'> & Partial<Omit<DB_TestItem, '_id' | 'name'>>;

/** Validator that accepts any UI_TestItem for tests. Returns undefined = valid. */
export const testItemValidator: (item?: UI_TestItem) => undefined = () => undefined;

/** Validator that always fails. Used by validation playwright test. */
export const failingValidator = (): string => 'invalid';

/** CrudTypes for the test entity (use in test subclasses and BaseDBConfig). */
export type TestItemTypes = CrudTypes<'test-item', DB_TestItem, UI_TestItem, typeof testItemValidator, (keyof DB_TestItem)[]>;

/** BaseDBConfig for validation tests (validator always fails). */
export type TestItemTypesFailingValidator = CrudTypes<'test-item', DB_TestItem, UI_TestItem, typeof failingValidator, (keyof DB_TestItem)[]>;

export const testItemBaseDBConfigFailingValidator: BaseDBConfig<TestItemTypesFailingValidator> = {
	dbKey: 'test-item',
	validator: failingValidator,
	uniqueKeys: ['_id'],
	versions: ['v1'],
	dbConfig: {
		name: 'test-item-store-validation',
		group: 'db-api-test',
		version: 'v1',
		uniqueKeys: ['_id']
	} as DBConfig<DB_TestItem>
};

/** BaseDBConfig for the test entity. */
export const testItemBaseDBConfig: BaseDBConfig<TestItemTypes> = {
	dbKey: 'test-item',
	validator: testItemValidator,
	uniqueKeys: ['_id'],
	versions: ['v1'],
	dbConfig: {
		name: 'test-item-store',
		group: 'db-api-test',
		version: 'v1',
		uniqueKeys: ['_id']
	} as DBConfig<DB_TestItem>
};

/** BaseDBConfig for upgrade test: versions [v1, v0] so v0 items are upgraded to v1. */
export const testItemBaseDBConfigUpgrade: BaseDBConfig<TestItemTypes> = {
	...testItemBaseDBConfig,
	versions: ['v1', 'v0'],
	dbConfig: {...testItemBaseDBConfig.dbConfig, name: 'test-item-store-upgrade'}
};

const basePath = 'v1/test-item';

/**
 * Factory for a stub CrudApiDefShape used by decorator and base-api tests.
 * Each slot has method and path; tests can replace or wrap the HTTP client.
 */
export function createStubCrudApiDefShape(): CrudApiDefShape {
	return {
		query: {method: HttpMethod.POST, path: `${basePath}/query`, timeout: 60000},
		queryUnique: {method: HttpMethod.GET, path: `${basePath}/query-unique`},
		upsert: {method: HttpMethod.POST, path: `${basePath}/upsert`},
		upsertAll: {method: HttpMethod.POST, path: `${basePath}/upsert-all`},
		patch: {method: HttpMethod.POST, path: `${basePath}/patch`},
		delete: {method: HttpMethod.GET, path: `${basePath}/delete-unique`},
		deleteQuery: {method: HttpMethod.POST, path: `${basePath}/delete`},
		deleteAll: {method: HttpMethod.GET, path: `${basePath}/delete-all`}
	};
}
