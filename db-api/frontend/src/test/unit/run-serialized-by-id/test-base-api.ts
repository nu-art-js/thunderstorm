/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Test-only subclass that exposes runSerializedById for unit tests.
 */

import {ModuleFE_BaseApi} from '../../../main/base/ModuleFE_BaseApi.js';
import {createStubCrudApiDefShape, testItemBaseDBConfig, testItemBaseDBConfigFailingValidator, testItemBaseDBConfigUpgrade} from '../../fixtures/index.js';
import type {TestItemTypes, TestItemTypesFailingValidator} from '../../fixtures/index.js';
import type {UI_TestItem} from '../../fixtures/index.js';

/** Test-only subclass exposing protected runSerializedById. Name ends with _Class for Module base. */
export class TestBaseApi_Class
	extends ModuleFE_BaseApi<TestItemTypes> {

	constructor() {
		super(testItemBaseDBConfig, createStubCrudApiDefShape());
	}

	/** Exposes runSerializedById for tests. */
	runSerializedByIdExposed<T>(id: string | undefined, requestType: 'upsert' | 'patch' | 'delete', fn: () => Promise<T>): Promise<T> {
		return this.runSerializedById(id, requestType, fn);
	}

	/** Exposes validateInternal for tests. */
	validateInternalExposed(data: Partial<UI_TestItem>): void {
		this.validateInternal(data);
	}
}

/** Test-only subclass with failing validator for validation playwright test. */
export class TestBaseApiValidation_Class
	extends ModuleFE_BaseApi<TestItemTypesFailingValidator> {

	constructor() {
		super(testItemBaseDBConfigFailingValidator, createStubCrudApiDefShape());
	}

	validateInternalExposed(data: Partial<UI_TestItem>): void {
		this.validateInternal(data);
	}
}

/** Test-only subclass with versions [v1, v0] for upgrade playwright test. */
export class TestBaseApiUpgrade_Class
	extends ModuleFE_BaseApi<TestItemTypes> {

	constructor() {
		super(testItemBaseDBConfigUpgrade, createStubCrudApiDefShape());
	}
}

/** Alias for Playwright/tests: window.DbApiFrontend.TestBaseApi */
export const TestBaseApi = TestBaseApi_Class;
/** Alias for Playwright/tests */
export const TestBaseApiValidation = TestBaseApiValidation_Class;
/** Alias for Playwright/tests */
export const TestBaseApiUpgrade = TestBaseApiUpgrade_Class;
