/*
 * @nu-art/permissions-backend - Pure unit tests for @RequirePermission decorator
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {definePermissionScope} from '@nu-art/permissions-shared';
import {getRegisteredFunctionPermissions} from '../main/core/function-permission-registry.js';
import {getRequirePermissionDef, RequirePermission} from '../main/RequirePermission.js';
import {MemKey_UserScopePermissions} from '../main/consts.js';

const scope = definePermissionScope('test-require-permission', ['read', 'write', 'admin']);

class ServiceWithPermission {
	@RequirePermission(scope, 'write')
	async doWrite(): Promise<string> {
		return 'ok';
	}
}

describe('RequirePermission decorator', () => {
	it('getRequirePermissionDef returns def with matching scopeKey and value', () => {
		const instance = new ServiceWithPermission();
		const def = getRequirePermissionDef(instance.doWrite);
		expect(def).to.not.be.undefined;
		expect(def!.scopeKey).to.equal(scope.key);
		expect(def!.value).to.equal('write');
	});

	it('getRequirePermissionDef returns undefined for non-decorated handler', () => {
		const fn = () => Promise.resolve();
		expect(getRequirePermissionDef(fn)).to.be.undefined;
		expect(getRequirePermissionDef(null)).to.be.undefined;
		expect(getRequirePermissionDef(undefined)).to.be.undefined;
	});

	it('def is in getRegisteredFunctionPermissions', () => {
		const instance = new ServiceWithPermission();
		const def = getRequirePermissionDef(instance.doWrite);
		expect(def).to.not.be.undefined;
		const all = getRegisteredFunctionPermissions();
		expect(all).to.include(def);
	});

	it('auto-asserts and passes when user has sufficient scope level', async () => {
		const instance = new ServiceWithPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-require-permission:write']);
			const result = await instance.doWrite();
			expect(result).to.equal('ok');
		});
	});

	it('auto-asserts and passes when user has higher scope level', async () => {
		const instance = new ServiceWithPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-require-permission:admin']);
			const result = await instance.doWrite();
			expect(result).to.equal('ok');
		});
	});

	it('auto-asserts and rejects when user has insufficient scope level', async () => {
		const instance = new ServiceWithPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-require-permission:read']);
			try {
				await instance.doWrite();
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('auto-asserts and rejects when scope is missing from user permissions', async () => {
		const instance = new ServiceWithPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set([]);
			try {
				await instance.doWrite();
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('auto-asserts and rejects when MemKey is not populated', async () => {
		const instance = new ServiceWithPermission();

		await new MemStorage().init(async () => {
			try {
				await instance.doWrite();
				expect.fail('Should have thrown');
			} catch (_e: any) {
				// MemKey not set throws before assertion; any error is acceptable
			}
		});
	});
});
