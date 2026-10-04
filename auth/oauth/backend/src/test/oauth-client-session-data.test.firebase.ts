/*
 * @nu-art/oauth-backend — oauthClient claim on a minted session JWT
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Day, generateHex, JwtTools, TEST_JwtTools} from '@nu-art/ts-common';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';
import {stormTester, type StormTestInput} from '@nu-art/storm-testalot';
import {expect} from 'chai';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {ModuleBE_SessionDB, type BaseSessionClaims} from '@nu-art/user-account-backend';
import type {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {SessionKey_OAuthClient, type DatabaseDef_OAuthClient} from '@nu-art/oauth-shared';
import {MemKey_OAuthClientId, ModuleBE_OAuthClientSessionData, SessionKey_OAuthClient_BE} from '../main/modules/ModuleBE_OAuthClientSessionData.js';

const clientRowId = stringToUniqueId<DatabaseDef_OAuthClient['dbKey']>('a'.repeat(32));

const initialClaims = (): BaseSessionClaims => ({
	accountId: stringToUniqueId<DatabaseDef_Account['dbKey']>(generateHex(32)),
	deviceId: generateHex(32),
	label: 'Cursor',
});

let restoreSecret: typeof ModuleBE_SessionDB['jwtHandler']['secret']['get'] | undefined;

const Storm_OAuthClientSession: StormTestInput = {
	modules: [
		ModuleBE_SessionDB,
		ModuleBE_OAuthClientSessionData,
	],
	config: {
		ModuleBE_SessionDB: {
			sessionTTLms: Day,
			rotationFactor: 0.5,
			jwtSigner: {secretKey: 'secret'},
		},
	},
	before: async () => {
		restoreSecret = ModuleBE_SessionDB['jwtHandler']['secret'].get;
		ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['secret'];
		TimeProxy.reset();
		TEST_JwtTools.beforeAll();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
	after: async () => {
		TEST_JwtTools.afterAll();
		TimeProxy.reset();
		if (restoreSecret)
			ModuleBE_SessionDB['jwtHandler']['secret'].get = restoreSecret;
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
};

describe('OAuth client session JWT', () => {
	it('stamps the client row id onto the minted JWT', async () => {
		await stormTester(Storm_OAuthClientSession, async () => {
			const dbSession = await new MemStorage().init(async () => {
				MemKey_OAuthClientId.set(clientRowId);
				return ModuleBE_SessionDB._session.create({initialClaims: initialClaims()});
			});

			const claims = await JwtTools.decode(dbSession.sessionIdJwt);
			expect(SessionKey_OAuthClient_BE.get(claims).clientId).to.equal(clientRowId);
			expect(claims.label).to.equal('Cursor');
		});
	});

	it('omits the claim when no client row is in context', async () => {
		await stormTester(Storm_OAuthClientSession, async () => {
			const dbSession = await ModuleBE_SessionDB._session.create({initialClaims: initialClaims()});
			const claims = await JwtTools.decode(dbSession.sessionIdJwt);
			expect(SessionKey_OAuthClient in claims).to.equal(false);
		});
	});

	it('reissue keeps the client row id', async () => {
		await stormTester(Storm_OAuthClientSession, async () => {
			const created = await new MemStorage().init(async () => {
				MemKey_OAuthClientId.set(clientRowId);
				return ModuleBE_SessionDB._session.create({initialClaims: initialClaims()});
			});

			const reissued = await new MemStorage().init(async () =>
				ModuleBE_SessionDB._session.rotate.reissue.bySession(created));

			const claims = await JwtTools.decode(reissued.sessionIdJwt);
			expect(SessionKey_OAuthClient_BE.get(claims).clientId).to.equal(clientRowId);
			expect(reissued.sessionIdJwt).to.not.equal(created.sessionIdJwt);
		});
	});
});
