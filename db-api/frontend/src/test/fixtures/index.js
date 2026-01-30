/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Shared test data and types for unit and Playwright tests.
 */
import { HttpMethod } from '@nu-art/http-client';
/** Validator that accepts any UI_TestItem for tests. Returns undefined = valid. */
export const testItemValidator = () => undefined;
/** Validator that always fails. Used by validation playwright test. */
export const failingValidator = () => 'invalid';
export const testItemBaseDBConfigFailingValidator = {
    dbKey: 'test-item',
    validator: failingValidator,
    uniqueKeys: ['_id'],
    versions: ['v1'],
    dbConfig: {
        name: 'test-item-store-validation',
        group: 'db-api-test',
        version: 'v1',
        uniqueKeys: ['_id']
    }
};
/** BaseDBConfig for the test entity. */
export const testItemBaseDBConfig = {
    dbKey: 'test-item',
    validator: testItemValidator,
    uniqueKeys: ['_id'],
    versions: ['v1'],
    dbConfig: {
        name: 'test-item-store',
        group: 'db-api-test',
        version: 'v1',
        uniqueKeys: ['_id']
    }
};
/** BaseDBConfig for upgrade test: versions [v1, v0] so v0 items are upgraded to v1. */
export const testItemBaseDBConfigUpgrade = {
    ...testItemBaseDBConfig,
    versions: ['v1', 'v0'],
    dbConfig: { ...testItemBaseDBConfig.dbConfig, name: 'test-item-store-upgrade' }
};
const basePath = 'v1/test-item';
/**
 * Factory for a stub CrudApiDefShape used by decorator and base-api tests.
 * Each slot has method and path; tests can replace or wrap the HTTP client.
 */
export function createStubCrudApiDefShape() {
    return {
        query: { method: HttpMethod.POST, path: `${basePath}/query`, timeout: 60000 },
        queryUnique: { method: HttpMethod.GET, path: `${basePath}/query-unique` },
        upsert: { method: HttpMethod.POST, path: `${basePath}/upsert` },
        upsertAll: { method: HttpMethod.POST, path: `${basePath}/upsert-all` },
        patch: { method: HttpMethod.POST, path: `${basePath}/patch` },
        delete: { method: HttpMethod.GET, path: `${basePath}/delete-unique` },
        deleteQuery: { method: HttpMethod.POST, path: `${basePath}/delete` },
        deleteAll: { method: HttpMethod.GET, path: `${basePath}/delete-all` }
    };
}
//# sourceMappingURL=index.js.map