/*
 * @nu-art/oauth-backend — oauthClient session claim
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {BaseSessionClaims, MemKey_SessionData} from '@nu-art/user-account-backend';
import type {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {SessionKey_OAuthClient, type DatabaseDef_OAuthClient} from '@nu-art/oauth-shared';
import {MemKey_OAuthClientId, ModuleBE_OAuthClientSessionData, SessionKey_OAuthClient_BE} from '../main/modules/ModuleBE_OAuthClientSessionData.js';

const clientRowId = stringToUniqueId<DatabaseDef_OAuthClient['dbKey']>('a'.repeat(32));
const otherClientId = stringToUniqueId<DatabaseDef_OAuthClient['dbKey']>('c'.repeat(32));
const baseClaims: BaseSessionClaims = {
	accountId: stringToUniqueId<DatabaseDef_Account['dbKey']>('b'.repeat(32)),
	deviceId: 'd'.repeat(32),
	label: 'Cursor',
};

describe('OAuth client session claim', () => {
	it('abstains when no client row is in context', async () => {
		await new MemStorage().init(async () => {
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims);
			expect(claim).to.equal(undefined);
		});
	});

	it('stamps the OAuth client row id from the memkey', async () => {
		await new MemStorage().init(async () => {
			MemKey_OAuthClientId.set(clientRowId);
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims);
			expect(claim).to.deep.equal({
				key: SessionKey_OAuthClient,
				value: {clientId: clientRowId},
			});
		});
	});

	it('prefers the memkey over a claim already on the session', async () => {
		await new MemStorage().init(async () => {
			MemKey_SessionData.set({oauthClient: {clientId: otherClientId}});
			MemKey_OAuthClientId.set(clientRowId);
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims);
			expect(claim?.value.clientId).to.equal(clientRowId);
		});
	});

	it('reads the claim through SessionKey_OAuthClient_BE', async () => {
		await new MemStorage().init(async () => {
			MemKey_SessionData.set({oauthClient: {clientId: clientRowId}});
			expect(SessionKey_OAuthClient_BE.get().clientId).to.equal(clientRowId);
		});
	});

	it('copies the claim already on the session when reissuing', async () => {
		await new MemStorage().init(async () => {
			MemKey_SessionData.set({oauthClient: {clientId: clientRowId}});
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims);
			expect(claim?.value.clientId).to.equal(clientRowId);
		});
	});
});
