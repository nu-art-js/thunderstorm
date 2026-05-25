import {generateHex, TEST_JwtTools} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/testalot';
import {stormTester, StormTestInput} from '@nu-art/storm-testalot';
import {expect} from 'chai';
import {stringToUniqueId} from '@nu-art/db-api-shared';
import {DatabaseDef_Account} from '@nu-art/user-account-shared';
import {ModuleBE_BootstrapTokenDB, ModuleBE_SessionDB} from '../_main.js';

const accountId = stringToUniqueId<DatabaseDef_Account['dbKey']>(generateHex(32));

let secretGet: any;

const DefaultTestConfig: StormTestInput = {
	modules: [
		ModuleBE_SessionDB,
		ModuleBE_BootstrapTokenDB,
	],
	config: {
		ModuleBE_SessionDB: {
			sessionTTLms: 86_400_000,
			rotationFactor: 0.5,
			jwtSigner: {secretKey: 'secret'}
		},
		ModuleBE_BootstrapTokenDB: {
			jwtSigner: {secretKey: 'bootstrap-secret'}
		}
	},
	before: async () => {
		secretGet = ModuleBE_BootstrapTokenDB['jwtHandler']['secret'].get;
		ModuleBE_BootstrapTokenDB['jwtHandler']['secret'].get = async () => ['bootstrap-test-secret'];
		ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['session-test-secret'];
		TEST_JwtTools.beforeAll();
		await ModuleBE_BootstrapTokenDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
	after: async () => {
		await ModuleBE_BootstrapTokenDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		TEST_JwtTools.afterAll();
		ModuleBE_BootstrapTokenDB['jwtHandler']['secret'].get = secretGet;
	}
};

describe('Bootstrap Token', () => {
	it('Create and validate bootstrap token', async () => {
		await stormTester(DefaultTestConfig, () => runSingleTestCase(
			async () => {
				const {token, entity} = await ModuleBE_BootstrapTokenDB.createToken(accountId, 'test-token');
				expect(token).to.be.a('string');
				expect(entity.accountId).to.equal(accountId);
				expect(entity.revoked).to.equal(false);

				const result = await ModuleBE_BootstrapTokenDB.validateToken(token);
				expect(result.accountId).to.equal(accountId);
			},
			{input: undefined, result: async () => {}}
		));
	});

	it('Revoked token should fail validation', async () => {
		await stormTester(DefaultTestConfig, () => runSingleTestCase(
			async () => {
				const {token} = await ModuleBE_BootstrapTokenDB.createToken(accountId, 'test-revoke');
				await ModuleBE_BootstrapTokenDB.revokeAllForAccount(accountId);

				try {
					await ModuleBE_BootstrapTokenDB.validateToken(token);
					expect.fail('Should have thrown');
				} catch (err: any) {
					expect(err.responseCode).to.equal(401);
				}
			},
			{input: undefined, result: async () => {}}
		));
	});
});
