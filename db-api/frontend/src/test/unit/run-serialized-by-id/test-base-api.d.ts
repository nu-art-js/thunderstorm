import { ModuleFE_BaseApi } from '../../../main/index.js';
import type { TestItemTypes, TestItemTypesFailingValidator, UI_TestItem } from '../../fixtures/index.js';
import { HttpClient } from '@nu-art/http-client';
/** Test-only subclass exposing protected runSerializedById. Name ends with _Class for Module base. */
export declare class TestBaseApi_Class extends ModuleFE_BaseApi<TestItemTypes> {
    constructor(client: HttpClient);
    /** Exposes runSerializedById for tests. */
    runSerializedByIdExposed<T>(id: string | undefined, requestType: 'upsert' | 'patch' | 'delete', fn: () => Promise<T>): Promise<T>;
    /** Exposes validateInternal for tests. */
    validateInternalExposed(data: Partial<UI_TestItem>): void;
    /** Exposes onQueryReturned for tests (e.g. toDelete behaviour). */
    onQueryReturnedExposed(toUpdate: TestItemTypes['dbItem'][], toDelete?: TestItemTypes['dbItem'][]): Promise<void>;
}
/** Test-only subclass with failing validator for validation playwright test. */
export declare class TestBaseApiValidation_Class extends ModuleFE_BaseApi<TestItemTypesFailingValidator> {
    constructor(client: HttpClient);
    validateInternalExposed(data: Partial<UI_TestItem>): void;
}
/** Test-only subclass with versions [v1, v0] for upgrade playwright test. */
export declare class TestBaseApiUpgrade_Class extends ModuleFE_BaseApi<TestItemTypes> {
    constructor(client: HttpClient);
}
/** Alias for Playwright/tests: window.DbApiFrontend.TestBaseApi */
export declare const TestBaseApi: typeof TestBaseApi_Class;
/** Alias for Playwright/tests */
export declare const TestBaseApiValidation: typeof TestBaseApiValidation_Class;
/** Alias for Playwright/tests */
export declare const TestBaseApiUpgrade: typeof TestBaseApiUpgrade_Class;
