/*
 * @nu-art/permissions-backend - Pure unit tests for PermissionAssertionContext
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {definePermissionScope} from '@nu-art/permissions-shared';
import {ModuleBE_PermissionsAssert} from '../main/modules/ModuleBE_PermissionsAssert.js';
import {MemKey_UserEntityContexts, MemKey_UserScopePermissions} from '../main/consts.js';

const Scope_Articles = definePermissionScope('articles', ['read', 'write', 'admin'] as const);
const Scope_Pipeline = definePermissionScope('pipeline', ['read', 'write', 'admin'] as const);

describe('PermissionAssertionContext', () => {
	describe('hasScope', () => {
		it('returns true when user has exact required value', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				expect(ctx.hasScope(Scope_Articles, 'write')).to.be.true;
			});
		});

		it('returns true when user has higher value than required', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:admin']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				expect(ctx.hasScope(Scope_Articles, 'write')).to.be.true;
			});
		});

		it('returns false when user has lower value than required', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:read']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				expect(ctx.hasScope(Scope_Articles, 'write')).to.be.false;
			});
		});

		it('returns false when scope is missing from user permissions', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['pipeline:admin']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				expect(ctx.hasScope(Scope_Articles, 'read')).to.be.false;
			});
		});

		it('returns false for unknown required value', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:admin']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				expect(ctx.hasScope(Scope_Articles, 'superadmin' as any)).to.be.false;
			});
		});
	});

	describe('and', () => {
		it('returns true when all predicates are true', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write', 'pipeline:read']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.and(
					ctx.hasScope(Scope_Articles, 'write'),
					ctx.hasScope(Scope_Pipeline, 'read')
				);
				expect(result).to.be.true;
			});
		});

		it('returns false when any predicate is false', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.and(
					ctx.hasScope(Scope_Articles, 'write'),
					ctx.hasScope(Scope_Pipeline, 'read')
				);
				expect(result).to.be.false;
			});
		});

		it('returns true with single true predicate', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:admin']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.and(ctx.hasScope(Scope_Articles, 'read'));
				expect(result).to.be.true;
			});
		});

		it('handles promise predicates', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.and(
					ctx.hasScope(Scope_Articles, 'write'),
					Promise.resolve(true)
				);
				expect(result).to.be.true;
			});
		});
	});

	describe('or', () => {
		it('returns true when any predicate is true', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.hasScope(Scope_Articles, 'admin'),
					ctx.hasScope(Scope_Articles, 'write')
				);
				expect(result).to.be.true;
			});
		});

		it('returns false when all predicates are false', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set([]);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.hasScope(Scope_Articles, 'read'),
					ctx.hasScope(Scope_Pipeline, 'read')
				);
				expect(result).to.be.false;
			});
		});

		it('handles promise predicates', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set([]);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.hasScope(Scope_Articles, 'read'),
					Promise.resolve(true)
				);
				expect(result).to.be.true;
			});
		});
	});

	describe('ownsEntity', () => {
		it('returns true when user has matching entity context', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set([]);
				MemKey_UserEntityContexts.set([{dbKey: 'articles', id: 'article-123'}]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.ownsEntity({dbKey: 'articles', id: 'article-123'});
				expect(result).to.be.true;
			});
		});

		it('returns false when entity context does not match', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set([]);
				MemKey_UserEntityContexts.set([{dbKey: 'articles', id: 'article-456'}]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.ownsEntity({dbKey: 'articles', id: 'article-123'});
				expect(result).to.be.false;
			});
		});

		it('returns false when entity contexts are empty', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set([]);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.ownsEntity({dbKey: 'articles', id: 'article-123'});
				expect(result).to.be.false;
			});
		});

		it('matches by both dbKey and id', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set([]);
				MemKey_UserEntityContexts.set([{dbKey: 'topics', id: 'article-123'}]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.ownsEntity({dbKey: 'articles', id: 'article-123'});
				expect(result).to.be.false;
			});
		});
	});

	describe('nested combinators', () => {
		it('supports and inside or', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write', 'pipeline:read']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.and(
						ctx.hasScope(Scope_Articles, 'write'),
						ctx.hasScope(Scope_Pipeline, 'read')
					),
					ctx.hasScope(Scope_Articles, 'admin')
				);
				expect(result).to.be.true;
			});
		});

		it('falls through to second or branch when first and fails', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:admin']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.and(
						ctx.hasScope(Scope_Articles, 'write'),
						ctx.hasScope(Scope_Pipeline, 'write')
					),
					ctx.hasScope(Scope_Articles, 'admin')
				);
				expect(result).to.be.true;
			});
		});

		it('rejects when all branches fail', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:read']);
				MemKey_UserEntityContexts.set([]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.and(
						ctx.hasScope(Scope_Articles, 'write'),
						ctx.hasScope(Scope_Pipeline, 'read')
					),
					ctx.hasScope(Scope_Articles, 'admin')
				);
				expect(result).to.be.false;
			});
		});

		it('combines ownsEntity with hasScope in or', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserScopePermissions.set(['articles:write']);
				MemKey_UserEntityContexts.set([{dbKey: 'articles', id: 'article-42'}]);
				const ctx = ModuleBE_PermissionsAssert.createAssertionContext();
				const result = await ctx.or(
					ctx.and(
						ctx.hasScope(Scope_Articles, 'write'),
						ctx.ownsEntity({dbKey: 'articles', id: 'article-42'})
					),
					ctx.hasScope(Scope_Articles, 'admin')
				);
				expect(result).to.be.true;
			});
		});
	});
});
