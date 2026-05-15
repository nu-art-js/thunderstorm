import {expect} from 'chai';
import {ApiException, generateHex} from '@nu-art/ts-common';
import {stormTester} from '@nu-art/storm-testalot';
import {DefaultStormTestConfig_PasswordAuth} from './utils/helpers.js';
import {ModuleBE_PasswordAuth} from './_main.js';
import {ModuleBE_AccountDB} from '@nu-art/user-account-backend';

const StormTestConfig = {
	...DefaultStormTestConfig_PasswordAuth,
};

describe('Password Auth - Service Account Guard', () => {
	it('service account email is unreachable via login (mangled email)', async () => {
		await stormTester(StormTestConfig, async () => {
			await ModuleBE_AccountDB.impl.create({email: 'svc@example.com', type: 'service'});

			try {
				await ModuleBE_PasswordAuth['account'].login({
					email: 'svc@example.com',
					password: 'anything',
					deviceId: generateHex(32)
				});
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e).to.be.instanceOf(ApiException);
				expect(e.responseCode).to.equal(401);
			}
		});
	});

	it('explicit type guard rejects service account even if resolved', async () => {
		await stormTester(StormTestConfig, async () => {
			const account = await ModuleBE_AccountDB.impl.create({email: 'svc@example.com', type: 'service'});

			try {
				await ModuleBE_PasswordAuth['account'].login({
					email: account.email,
					password: 'anything',
					deviceId: generateHex(32)
				});
				expect.fail('Should have thrown');
			} catch (e: any) {
				expect(e).to.be.instanceOf(ApiException);
				expect(e.responseCode).to.equal(403);
			}
		});
	});

	it('allows login for user account with valid credentials', async () => {
		await stormTester(StormTestConfig, async () => {
			const account = await ModuleBE_AccountDB.impl.create({email: 'user@example.com', type: 'user'});
			await ModuleBE_PasswordAuth['credentials'].create(account, 'testpass123');

			const result = await ModuleBE_PasswordAuth['account'].login({
				email: 'user@example.com',
				password: 'testpass123',
				deviceId: generateHex(32)
			});
			expect(result._id).to.equal(account._id);
		});
	});
});
