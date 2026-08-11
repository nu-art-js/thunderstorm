/*
 * @nu-art/permissions-backend - Pure unit tests for systemOnly elevation gate
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ApiException} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage';
import {ModuleBE_Permissions, ServiceAccountId_Bootstrap} from '../main/modules/ModuleBE_Permissions.js';
import {MemKey_ServiceAccountId, MemKey_UserScopePermissions} from '../main/consts.js';

describe('runAsServiceAccount systemOnly gate', () => {
	it('rejects elevation from a user context without service-account:run', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['permissions-ui:view', 'access-group:create']);

			try {
				await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => 'ok');
				expect.fail('expected ApiException 403');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).responseCode).to.equal(403);
				expect((e as ApiException).message).to.include('service-account:run');
			}
		});
	});

	it('allows elevation from a user context that holds service-account:run', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['service-account:run']);

			// Gate passes; bootstrap materialization may still fail without DB — only assert we
			// did not get the systemOnly user-context rejection.
			try {
				await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => 'ok');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).message).to.not.include('cannot be used within a user context');
			}
		});
	});

	it('allows nested elevation when already running as a service account', async () => {
		await new MemStorage().init(async () => {
			MemKey_UserScopePermissions.set(['permissions-ui:view']);
			MemKey_ServiceAccountId.set('some-other-sa');

			try {
				await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => 'ok');
			} catch (e) {
				expect(e).to.be.instanceOf(ApiException);
				expect((e as ApiException).message).to.not.include('cannot be used within a user context');
			}
		});
	});
});
