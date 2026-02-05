/*
 * @nu-art/permissions-backend - Pure unit tests for permission assertion logic
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_UserPermissions, ModuleBE_PermissionsAssert} from '../main/index.js';
import type {FunctionPermissionDef} from '../main/core/function-permission-registry.js';
import type {TypedMap} from '@nu-art/ts-common';

describe('ModuleBE_PermissionsAssert', () => {
	describe('assertUserPassesAccessLevels', () => {
		type Input = { domainToLevelValueMap: TypedMap<number>; userPermissions: TypedMap<number> };
		type Result = boolean;
		type TestCase_AssertLevels = TestModel<Input, Result>;

		const test = async (input: Input): Promise<Result> => {
			ModuleBE_PermissionsAssert.assertUserPassesAccessLevels(input.domainToLevelValueMap, input.userPermissions);
			return true;
		};
		const runTestCase = (testCase: TestCase_AssertLevels) => () => runSingleTestCase(test, testCase);

		it('passes when user has all domains with value >= required', runTestCase({
			input: {
				domainToLevelValueMap: { domain1: 100 },
				userPermissions: { domain1: 100 }
			},
			result: true
		}));

		it('passes when user level is higher than required', runTestCase({
			input: {
				domainToLevelValueMap: { domain1: 100 },
				userPermissions: { domain1: 200 }
			},
			result: true
		}));

		it('throws 403 when user missing domain', runTestCase({
			input: {
				domainToLevelValueMap: { domain1: 100 },
				userPermissions: {}
			},
			error: { expected: /Missing Access For This Domain/ }
		}));

		it('throws 403 when user level lower than required', runTestCase({
			input: {
				domainToLevelValueMap: { domain1: 100 },
				userPermissions: { domain1: 50 }
			},
			error: { expected: /Action Forbidden/ }
		}));
	});

	describe('assertFunctionPermission', () => {
		type Input = { def: FunctionPermissionDef; userPermissions: TypedMap<number> };
		type Result = boolean;
		type TestCase_AssertFunction = TestModel<Input, Result>;

		const test = async (input: Input): Promise<Result> => {
			await new MemStorage().init(async () => {
				MemKey_UserPermissions.set(input.userPermissions);
				ModuleBE_PermissionsAssert.assertFunctionPermission(input.def);
			});
			return true;
		};
		const runTestCase = (testCase: TestCase_AssertFunction) => () => runSingleTestCase(test, testCase);

		it('passes when def is provisioned and user has >= level', runTestCase({
			input: {
				def: { id: 'x', scopeKey: 's', value: 'v', domainId: 'd1', levelValue: 100 },
				userPermissions: { d1: 100 }
			},
			result: true
		}));

		it('throws 503 when def not provisioned (no domainId)', runTestCase({
			input: {
				def: { id: 'x', scopeKey: 's', value: 'v' },
				userPermissions: {}
			},
			error: { expected: /not yet provisioned/ }
		}));

		it('throws 503 when def not provisioned (no levelValue)', runTestCase({
			input: {
				def: { id: 'x', scopeKey: 's', value: 'v', domainId: 'd1' },
				userPermissions: { d1: 100 }
			},
			error: { expected: /not yet provisioned/ }
		}));

		it('throws 403 when user missing domain', runTestCase({
			input: {
				def: { id: 'x', scopeKey: 's', value: 'v', domainId: 'd1', levelValue: 100 },
				userPermissions: {}
			},
			error: { expected: /Missing Access For This Domain/ }
		}));

		it('throws 403 when user level less than required', runTestCase({
			input: {
				def: { id: 'x', scopeKey: 's', value: 'v', domainId: 'd1', levelValue: 100 },
				userPermissions: { d1: 50 }
			},
			error: { expected: /Action Forbidden/ }
		}));
	});
});
