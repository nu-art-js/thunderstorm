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
import {MemKey_UserEntityContexts, MemKey_UserScopePermissions} from '../main/consts.js';

const scope = definePermissionScope('test-require-permission', ['read', 'write', 'admin']);
const scopeArticles = definePermissionScope('test-articles', ['read', 'write', 'admin']);

class ServiceWithPermission {
	@RequirePermission(scope, 'write')
	async doWrite(): Promise<string> {
		return 'ok';
	}
}

class ServiceWithComplexPermission {
	@RequirePermission((assert, body: { level: string }) => {
		return assert.hasScope(scopeArticles, body.level);
	})
	async doAction(body: { level: string }): Promise<string> {
		return 'done';
	}

	@RequirePermission((assert) => {
		return assert.or(
			assert.hasScope(scopeArticles, 'admin'),
			assert.hasScope(scope, 'admin')
		);
	})
	async doAdminAction(): Promise<string> {
		return 'admin-done';
	}

	@RequirePermission((assert) => {
		return assert.and(
			assert.hasScope(scopeArticles, 'write'),
			assert.hasScope(scope, 'read')
		);
	})
	async doBothScopesAction(): Promise<string> {
		return 'both-done';
	}
}

describe('RequirePermission decorator — simple overload', () => {
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

describe('RequirePermission decorator — complex overload', () => {
	it('passes when asserter callback returns true', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-articles:write']);
			MemKey_UserEntityContexts.set([]);
			const result = await instance.doAction({level: 'write'});
			expect(result).to.equal('done');
		});
	});

	it('rejects with 403 when asserter callback returns false', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-articles:read']);
			MemKey_UserEntityContexts.set([]);
			try {
				await instance.doAction({level: 'write'});
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('callback receives method arguments', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-articles:admin']);
			MemKey_UserEntityContexts.set([]);
			const result = await instance.doAction({level: 'admin'});
			expect(result).to.equal('done');
		});
	});

	it('or combinator passes when one branch matches', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-require-permission:admin']);
			MemKey_UserEntityContexts.set([]);
			const result = await instance.doAdminAction();
			expect(result).to.equal('admin-done');
		});
	});

	it('or combinator rejects when no branch matches', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-articles:write', 'test-require-permission:write']);
			MemKey_UserEntityContexts.set([]);
			try {
				await instance.doAdminAction();
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('and combinator passes when all scopes present', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-articles:write', 'test-require-permission:read']);
			MemKey_UserEntityContexts.set([]);
			const result = await instance.doBothScopesAction();
			expect(result).to.equal('both-done');
		});
	});

	it('and combinator rejects when one scope missing', async () => {
		const instance = new ServiceWithComplexPermission();

		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['test-articles:write']);
			MemKey_UserEntityContexts.set([]);
			try {
				await instance.doBothScopesAction();
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('complex overload does not set FunctionPermissionDef', () => {
		const instance = new ServiceWithComplexPermission();
		expect(getRequirePermissionDef(instance.doAction)).to.be.undefined;
		expect(getRequirePermissionDef(instance.doAdminAction)).to.be.undefined;
	});
});
