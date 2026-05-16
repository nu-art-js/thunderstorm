/*
 * @nu-art/permissions-backend - Pure unit tests for share API
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {MemKey_ServiceAccountId, MemKey_UserAccessIds} from '../main/consts.js';
import {ModuleBE_Permissions, type ShareAccessContext} from '../main/modules/ModuleBE_Permissions.js';

const mod = ModuleBE_Permissions as any;

describe('share API', () => {
	describe('assertShareAccess', () => {
		it('passes when running as service account', async () => {
			await new MemStorage().init(async () => {
				MemKey_ServiceAccountId.set('test-sa');
				MemKey_UserAccessIds.set({_self: ['sa-group-id']});

				expect(() => mod.assertShareAccess({__access: {readers: [], writers: [], deleters: [], owners: []}}))
					.to.not.throw();
			});
		});

		it('passes when user is in writers', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserAccessIds.set({_self: ['user-group-id']});

				expect(() => mod.assertShareAccess({
					__access: {readers: [], writers: ['user-group-id'], deleters: [], owners: []}
				})).to.not.throw();
			});
		});

		it('passes when user is in owners', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserAccessIds.set({_self: ['user-group-id']});

				expect(() => mod.assertShareAccess({
					__access: {readers: [], writers: [], deleters: [], owners: ['user-group-id']}
				})).to.not.throw();
			});
		});

		it('throws when user has no write or owner access', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserAccessIds.set({_self: ['user-group-id']});

				expect(() => mod.assertShareAccess({
					__access: {readers: ['user-group-id'], writers: [], deleters: [], owners: []}
				})).to.throw('Write access required');
			});
		});

		it('throws when no access context is present', async () => {
			await new MemStorage().init(async () => {
				expect(() => mod.assertShareAccess({
					__access: {readers: [], writers: [], deleters: [], owners: []}
				})).to.throw('No access context');
			});
		});

		it('passes with scoped access IDs that include write access', async () => {
			await new MemStorage().init(async () => {
				MemKey_UserAccessIds.set({
					_self: ['personal-id'],
					'feature-scope': ['feature-group-id'],
				});

				expect(() => mod.assertShareAccess({
					__access: {readers: [], writers: ['feature-group-id'], deleters: [], owners: []}
				})).to.not.throw();
			});
		});
	});

	describe('buildAddToSetUpdate', () => {
		it('builds $addToSet for readers', () => {
			const ctx: ShareAccessContext = {readers: ['group-a', 'group-b']};
			const result = mod.buildAddToSetUpdate(ctx);

			expect(result).to.deep.equal({
				'__access.readers': {$each: ['group-a', 'group-b']},
			});
		});

		it('builds $addToSet for multiple access keys', () => {
			const ctx: ShareAccessContext = {
				readers: ['group-a'],
				writers: ['group-b'],
			};
			const result = mod.buildAddToSetUpdate(ctx);

			expect(result).to.deep.equal({
				'__access.readers': {$each: ['group-a']},
				'__access.writers': {$each: ['group-b']},
			});
		});

		it('builds $addToSet for all four access keys', () => {
			const ctx: ShareAccessContext = {
				readers: ['r1'],
				writers: ['w1'],
				deleters: ['d1'],
				owners: ['o1'],
			};
			const result = mod.buildAddToSetUpdate(ctx);

			expect(result).to.deep.equal({
				'__access.readers': {$each: ['r1']},
				'__access.writers': {$each: ['w1']},
				'__access.deleters': {$each: ['d1']},
				'__access.owners': {$each: ['o1']},
			});
		});

		it('returns undefined for empty context', () => {
			const result = mod.buildAddToSetUpdate({});
			expect(result).to.be.undefined;
		});

		it('skips keys with empty arrays', () => {
			const ctx: ShareAccessContext = {readers: [], writers: ['group-a']};
			const result = mod.buildAddToSetUpdate(ctx);

			expect(result).to.deep.equal({
				'__access.writers': {$each: ['group-a']},
			});
		});

		it('returns undefined when all arrays are empty', () => {
			const ctx: ShareAccessContext = {readers: [], writers: [], deleters: [], owners: []};
			const result = mod.buildAddToSetUpdate(ctx);
			expect(result).to.be.undefined;
		});
	});
});
