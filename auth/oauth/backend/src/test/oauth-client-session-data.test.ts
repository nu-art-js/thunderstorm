/*
 * @nu-art/oauth-backend — oauthClient session claim
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_SessionData} from '@nu-art/user-account-backend';
import {SessionKey_OAuthClient} from '@nu-art/oauth-shared';
import {MemKey_OAuthClientId, ModuleBE_OAuthClientSessionData} from '../main/modules/ModuleBE_OAuthClientSessionData.js';

const clientRowId = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const baseClaims = {
	accountId: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
	deviceId: 'device-1',
	label: 'Cursor',
};

describe('OAuth client session claim', () => {
	it('abstains when no client row is in context', async () => {
		await new MemStorage().init(async () => {
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims as never);
			expect(claim).to.equal(undefined);
		});
	});

	it('stamps the OAuth client row id from the memkey', async () => {
		await new MemStorage().init(async () => {
			MemKey_OAuthClientId.set(clientRowId as never);
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims as never);
			expect(claim).to.deep.equal({
				key: SessionKey_OAuthClient,
				value: {clientId: clientRowId},
			});
		});
	});

	it('prefers the memkey over a claim already on the session', async () => {
		await new MemStorage().init(async () => {
			MemKey_SessionData.set({oauthClient: {clientId: 'cccccccccccccccccccccccccccccccc'}});
			MemKey_OAuthClientId.set(clientRowId as never);
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims as never);
			expect(claim?.value.clientId).to.equal(clientRowId);
		});
	});

	it('copies the claim already on the session when reissuing', async () => {
		await new MemStorage().init(async () => {
			MemKey_SessionData.set({
				oauthClient: {clientId: clientRowId},
			});
			const claim = await ModuleBE_OAuthClientSessionData.__collectSessionData(baseClaims as never);
			expect(claim?.value.clientId).to.equal(clientRowId);
		});
	});
});
