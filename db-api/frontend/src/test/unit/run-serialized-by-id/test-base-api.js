/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Test-only subclass that exposes runSerializedById for unit tests.
 */
import { ModuleFE_BaseApi } from '../../../main/index.js';
import { createStubCrudApiDefShape, testItemBaseDBConfig, testItemBaseDBConfigFailingValidator, testItemBaseDBConfigUpgrade } from '../../fixtures/index.js';
/** Test-only subclass exposing protected runSerializedById. Name ends with _Class for Module base. */
export class TestBaseApi_Class extends ModuleFE_BaseApi {
    constructor(client) {
        super({
            config: testItemBaseDBConfig,
            crudApiDef: createStubCrudApiDefShape(),
            httpClient: client
        });
    }
    /** Exposes runSerializedById for tests. */
    runSerializedByIdExposed(id, requestType, fn) {
        return this.runSerializedById(id, requestType, fn);
    }
    /** Exposes validateInternal for tests. */
    validateInternalExposed(data) {
        this.validateInternal(data);
    }
    /** Exposes onQueryReturned for tests (e.g. toDelete behaviour). */
    onQueryReturnedExposed(toUpdate, toDelete = []) {
        return this.onQueryReturned(toUpdate, toDelete);
    }
}
/** Test-only subclass with failing validator for validation playwright test. */
export class TestBaseApiValidation_Class extends ModuleFE_BaseApi {
    constructor(client) {
        super({
            config: testItemBaseDBConfigFailingValidator,
            crudApiDef: createStubCrudApiDefShape(),
            httpClient: client
        });
    }
    validateInternalExposed(data) {
        this.validateInternal(data);
    }
}
/** Test-only subclass with versions [v1, v0] for upgrade playwright test. */
export class TestBaseApiUpgrade_Class extends ModuleFE_BaseApi {
    constructor(client) {
        super({
            config: testItemBaseDBConfigUpgrade,
            crudApiDef: createStubCrudApiDefShape(),
            httpClient: client
        });
    }
}
/** Alias for Playwright/tests: window.DbApiFrontend.TestBaseApi */
export const TestBaseApi = TestBaseApi_Class;
/** Alias for Playwright/tests */
export const TestBaseApiValidation = TestBaseApiValidation_Class;
/** Alias for Playwright/tests */
export const TestBaseApiUpgrade = TestBaseApiUpgrade_Class;
//# sourceMappingURL=test-base-api.js.map