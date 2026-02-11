/*
 * @nu-art/app-config-backend - Firebase tests for ModuleBE_AppConfigDB and getConfigByKey (no thunderstorm)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {expect} from 'chai';
import {AppConfigKey_BE, ModuleBE_AppConfigDB} from '../main/ModuleBE_AppConfigDB.js';
import {cleanupAppConfigCollection, setupFirebaseEmulator} from './utils/helpers.js';

type Input_GetResolver404 = { key: string };
type Result_GetResolver404 = never;
type TestCase_GetResolver404 = TestModel<Input_GetResolver404, Result_GetResolver404>;

const test_GetResolver404 = async (input: Input_GetResolver404): Promise<Result_GetResolver404> => {
	await ModuleBE_AppConfigDB.getResolverDataByKey(input.key);
	throw new Error('expected ApiException');
};

const run_GetResolver404 = (tc: TestCase_GetResolver404) => async () => runSingleTestCase(test_GetResolver404, tc);

type Input_RegisterAndGet = { key: string; resolverValue: unknown };
type Result_RegisterAndGet = unknown;
type TestCase_RegisterAndGet = TestModel<Input_RegisterAndGet, Result_RegisterAndGet>;

const test_RegisterAndGet = async (input: Input_RegisterAndGet): Promise<Result_RegisterAndGet> => {
	new AppConfigKey_BE(input.key, async () => input.resolverValue);
	const first = await ModuleBE_AppConfigDB.getResolverDataByKey(input.key);
	const second = await ModuleBE_AppConfigDB.getResolverDataByKey(input.key);
	expect(second).to.deep.equal(first);
	return first;
};

const run_RegisterAndGet = (tc: TestCase_RegisterAndGet) => async () => runSingleTestCase(test_RegisterAndGet, tc);

type Input_SetAndGet = { key: string; initial: unknown; setValue: unknown };
type Result_SetAndGet = unknown;
type TestCase_SetAndGet = TestModel<Input_SetAndGet, Result_SetAndGet>;

const test_SetAndGet = async (input: Input_SetAndGet): Promise<Result_SetAndGet> => {
	const appKey = new AppConfigKey_BE(input.key, async () => input.initial);
	await appKey.get();
	await appKey.set(input.setValue);
	const got = await appKey.get();
	expect(got).to.deep.equal(input.setValue);
	return got;
};

const run_SetAndGet = (tc: TestCase_SetAndGet) => async () => runSingleTestCase(test_SetAndGet, tc);

type Input_CreateDefaults = { key1: string; key2: string; value1: unknown; value2: unknown };
type Result_CreateDefaults = boolean;
type TestCase_CreateDefaults = TestModel<Input_CreateDefaults, Result_CreateDefaults>;

const test_CreateDefaults = async (input: Input_CreateDefaults): Promise<Result_CreateDefaults> => {
	new AppConfigKey_BE(input.key1, async () => input.value1);
	new AppConfigKey_BE(input.key2, async () => input.value2);
	await ModuleBE_AppConfigDB.createDefaults();
	const v1 = await ModuleBE_AppConfigDB.getResolverDataByKey(input.key1);
	const v2 = await ModuleBE_AppConfigDB.getResolverDataByKey(input.key2);
	expect(v1).to.deep.equal(input.value1);
	expect(v2).to.deep.equal(input.value2);
	return true;
};

const run_CreateDefaults = (tc: TestCase_CreateDefaults) => async () => runSingleTestCase(test_CreateDefaults, tc);

type Input_GetConfigByKeyApi = { key: string; resolverValue: unknown };
type Result_GetConfigByKeyApi = unknown;
type TestCase_GetConfigByKeyApi = TestModel<Input_GetConfigByKeyApi, Result_GetConfigByKeyApi>;

/** Tests the data path used by getConfigByKey API (no HTTP; ModuleBE_AppConfigAPI not loaded in test env). */
const test_GetConfigByKeyApi = async (input: Input_GetConfigByKeyApi): Promise<Result_GetConfigByKeyApi> => {
	new AppConfigKey_BE(input.key, async () => input.resolverValue);
	const fromDb = await ModuleBE_AppConfigDB.getResolverDataByKey(input.key);
	expect(fromDb).to.deep.equal(input.resolverValue);
	return fromDb;
};

const run_GetConfigByKeyApi = (tc: TestCase_GetConfigByKeyApi) => async () => runSingleTestCase(test_GetConfigByKeyApi, tc);

describe('App-config - Firebase (emulator only)', () => {
	before(async () => {
		await setupFirebaseEmulator();
	});
	after(async () => {
		await cleanupAppConfigCollection();
	});

	describe('getResolverDataByKey', () => {
		it('throws 404 when key is not registered', async () => {
			await run_GetResolver404({
				description: '404 for unregistered key',
				input: {key: 'firebase-test-nonexistent-key'},
				error: {expected: /Could not find an app config with key/},
			})();
		});
	});

	describe('registerKey and getAppKey', () => {
		it('returns resolver value and persists', async () => {
			await run_RegisterAndGet({
				description: 'resolver value persisted',
				input: {key: 'firebase-test-register-1', resolverValue: {a: 1, b: 2}},
				result: {a: 1, b: 2},
			})();
		});
	});

	describe('setAppKey and getAppKey', () => {
		it('set then get returns set value', async () => {
			await run_SetAndGet({
				description: 'set then get',
				input: {
					key: 'firebase-test-set-1',
					initial: {x: 0},
					setValue: {x: 99},
				},
				result: {x: 99},
			})();
		});
	});

	describe('createDefaults', () => {
		it('creates entries for all registered keys', async () => {
			await run_CreateDefaults({
				description: 'createDefaults two keys',
				input: {
					key1: 'firebase-test-defaults-1',
					key2: 'firebase-test-defaults-2',
					value1: {v: 1},
					value2: {v: 2},
				},
				result: true,
			})();
		});
	});

	describe('getConfigByKey API', () => {
		it('returns same as getResolverDataByKey', async () => {
			await run_GetConfigByKeyApi({
				description: 'API matches DB',
				input: {key: 'firebase-test-api-1', resolverValue: {api: true}},
				result: {api: true},
			})();
		});
	});
});
