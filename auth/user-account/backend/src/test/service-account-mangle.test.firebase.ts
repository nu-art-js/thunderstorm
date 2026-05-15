import {expect} from 'chai';
import {stormTester} from '@nu-art/storm-testalot';
import {DefaultStormTestConfig_SessionAndAccount} from './utils/helpers.js';
import {ModuleBE_AccountDB} from './_main.js';
import {isServiceEmail} from '@nu-art/user-account-shared';

const StormTestConfig = {
	...DefaultStormTestConfig_SessionAndAccount,
};

describe('Service Account Email Mangling', () => {
	it('service account email gets mangled on create', async () => {
		await stormTester(StormTestConfig, async () => {
			const account = await ModuleBE_AccountDB.impl.create({email: 'bot@example.com', type: 'service'});
			expect(isServiceEmail(account.email)).to.equal(true);
			expect(account.email).to.not.equal('bot@example.com');
		});
	});

	it('user account email stays unchanged on create', async () => {
		await stormTester(StormTestConfig, async () => {
			const account = await ModuleBE_AccountDB.impl.create({email: 'user@example.com', type: 'user'});
			expect(isServiceEmail(account.email)).to.equal(false);
			expect(account.email).to.equal('user@example.com');
		});
	});

	it('mangling is idempotent on update', async () => {
		await stormTester(StormTestConfig, async () => {
			const account = await ModuleBE_AccountDB.impl.create({email: 'bot@example.com', type: 'service'});
			const mangledEmail = account.email;

			const updated = await ModuleBE_AccountDB.set.item({...account, description: 'updated'});
			expect(updated.email).to.equal(mangledEmail);
		});
	});

	it('service account email cannot be looked up by original email', async () => {
		await stormTester(StormTestConfig, async () => {
			await ModuleBE_AccountDB.impl.create({email: 'bot@example.com', type: 'service'});

			const results = await ModuleBE_AccountDB.query.custom({where: {email: 'bot@example.com'}, limit: 1});
			expect(results.length).to.equal(0);
		});
	});
});
