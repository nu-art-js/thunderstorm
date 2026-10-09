/*
 * @nu-art/db-api-frontend - Database API infrastructure for Thunderstorm frontend
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 *
 * Test-only subclass that exposes runSerializedById for unit tests.
 */

import {ModuleFE_BaseApi} from '../../../main/index.js';
import type {TestItemTypes, TestItemTypesFailingValidator, UI_TestItem} from '../../fixtures/index.js';
import {createStubCrudApiDefShape, testItemBaseDBConfig, testItemBaseDBConfigFailingValidator, testItemBaseDBConfigUpgrade} from '../../fixtures/index.js';
import {HttpClient} from '@nu-art/http-client';

/** Test spy shape used by dispatcher tests (window.DbApiFrontend.TestBaseApi#setDispatcher). */
export type TestDispatchSpy = {
	dispatchModule?: (event: string, item: any) => void;
	dispatchUI?: (event: string, item: any) => void;
	dispatchAll?: (event: string, item: any) => void;
};

/**
 * Base DB now takes a single event dispatcher in the constructor; tests route it to an optional, swappable spy.
 * Each event reaches the spy's module and UI hooks (or dispatchAll when the spy only has that).
 */
const createTestDispatcher = (target: { spy?: TestDispatchSpy }) => (event: string, item: any) => {
	const spy = target.spy;
	if (!spy)
		return;

	if (!spy.dispatchModule && !spy.dispatchUI)
		return spy.dispatchAll?.(event, item);

	spy.dispatchModule?.(event, item);
	spy.dispatchUI?.(event, item);
};

/** Test-only subclass exposing protected runSerializedById. Name ends with _Class for Module base. */
export class TestBaseApi_Class
	extends ModuleFE_BaseApi<TestItemTypes> {

	private readonly dispatchTarget: { spy?: TestDispatchSpy };

	constructor(client: HttpClient) {
		const dispatchTarget: { spy?: TestDispatchSpy } = {};
		super({
			config: testItemBaseDBConfig,
			crudApiDef: createStubCrudApiDefShape(),
			dispatcher: createTestDispatcher(dispatchTarget),
			httpClient: client
		});
		this.dispatchTarget = dispatchTarget;
	}

	/** Routes this module's dispatched events to the given spy. */
	setDispatcher(spy: TestDispatchSpy): void {
		this.dispatchTarget.spy = spy;
	}

	/** Exposes runSerializedById for tests. */
	runSerializedByIdExposed<T>(id: string | undefined, requestType: 'upsert' | 'patch' | 'delete', fn: () => Promise<T>): Promise<T> {
		return this.runSerializedById(id, requestType, fn);
	}

	/** Exposes validateInternal for tests. */
	validateInternalExposed(data: Partial<UI_TestItem>): void {
		this.validateInternal(data);
	}

	/** Exposes onQueryReturned for tests (e.g. toDelete behaviour). */
	onQueryReturnedExposed(toUpdate: TestItemTypes['dbItem'][], toDelete: TestItemTypes['dbItem'][] = []): Promise<void> {
		return this.onQueryReturned(toUpdate, toDelete);
	}
}

/** Test-only subclass with failing validator for validation playwright test. */
export class TestBaseApiValidation_Class
	extends ModuleFE_BaseApi<TestItemTypesFailingValidator> {

	constructor(client: HttpClient) {
		super({
			config: testItemBaseDBConfigFailingValidator,
			crudApiDef: createStubCrudApiDefShape(),
			dispatcher: createTestDispatcher({}),
			httpClient: client
		});
	}

	validateInternalExposed(data: Partial<UI_TestItem>): void {
		this.validateInternal(data);
	}
}

/** Test-only subclass with versions [v1, v0] for upgrade playwright test. */
export class TestBaseApiUpgrade_Class
	extends ModuleFE_BaseApi<TestItemTypes> {

	constructor(client: HttpClient) {
		super({
			config: testItemBaseDBConfigUpgrade,
			crudApiDef: createStubCrudApiDefShape(),
			dispatcher: createTestDispatcher({}),
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
