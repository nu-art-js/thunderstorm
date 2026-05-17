import {expect} from 'chai';
import {generateHex, hashPasswordWithSalt} from '@nu-art/ts-common';
import {stormTester} from '@nu-art/storm-testalot';
import {DefaultStormTestConfig_PasswordAuth} from './utils/helpers.js';
import {ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import {ModuleBE_PasswordCredentialDB} from './_main.js';

const StormTestConfig = {
	...DefaultStormTestConfig_PasswordAuth,
};

async function insertLegacyPasswordFields(accountId: string, salt: string, saltedPassword: string, newPasswordRequired?: boolean) {
	const updateFields: Record<string, unknown> = {salt, saltedPassword};
	if (newPasswordRequired !== undefined)
		updateFields._newPasswordRequired = newPasswordRequired;

	await (ModuleBE_AccountDB.collection as any).mongoCollection.updateOne(
		{_id: accountId},
		{$set: updateFields}
	);
}

describe('Password Auth - Migration from DB_Account to DB_PasswordCredentials', () => {
	it('migrates salt + saltedPassword from account to credentials', async () => {
		await stormTester(StormTestConfig, async () => {
			const salt = generateHex(32);
			const saltedPassword = hashPasswordWithSalt(salt, 'testpass');
			const account = await ModuleBE_AccountDB.impl.create({email: 'user@example.com', type: 'user'});

			await insertLegacyPasswordFields(account._id, salt, saltedPassword);

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const credentials = await ModuleBE_PasswordCredentialDB.query.custom({where: {accountId: account._id}, limit: 1});
			expect(credentials).to.have.length(1);
			expect(credentials[0].salt).to.equal(salt);
			expect(credentials[0].saltedPassword).to.equal(saltedPassword);
			expect(credentials[0].accountId).to.equal(account._id);
		});
	});

	it('preserves _newPasswordRequired flag during migration', async () => {
		await stormTester(StormTestConfig, async () => {
			const salt = generateHex(32);
			const saltedPassword = hashPasswordWithSalt(salt, 'temppass');
			const account = await ModuleBE_AccountDB.impl.create({email: 'user@example.com', type: 'user'});

			await insertLegacyPasswordFields(account._id, salt, saltedPassword, true);

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const credentials = await ModuleBE_PasswordCredentialDB.query.custom({where: {accountId: account._id}, limit: 1});
			expect(credentials).to.have.length(1);
			expect(credentials[0]._newPasswordRequired).to.equal(true);
		});
	});

	it('removes legacy fields from account after migration', async () => {
		await stormTester(StormTestConfig, async () => {
			const salt = generateHex(32);
			const saltedPassword = hashPasswordWithSalt(salt, 'testpass');
			const account = await ModuleBE_AccountDB.impl.create({email: 'user@example.com', type: 'user'});

			await insertLegacyPasswordFields(account._id, salt, saltedPassword, true);

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const rawAccount = await (ModuleBE_AccountDB.collection as any).mongoCollection.findOne({_id: account._id});
			expect(rawAccount).to.not.have.property('salt');
			expect(rawAccount).to.not.have.property('saltedPassword');
			expect(rawAccount).to.not.have.property('_newPasswordRequired');
		});
	});

	it('skips service accounts — no credentials created', async () => {
		await stormTester(StormTestConfig, async () => {
			const salt = generateHex(32);
			const saltedPassword = hashPasswordWithSalt(salt, 'svcpass');
			const svcAccount = await ModuleBE_AccountDB.impl.create({email: 'svc@example.com', type: 'service'});

			await insertLegacyPasswordFields(svcAccount._id, salt, saltedPassword);

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const credentials = await ModuleBE_PasswordCredentialDB.query.custom({where: {accountId: svcAccount._id}, limit: 1});
			expect(credentials).to.have.length(0);
		});
	});

	it('is idempotent — running twice produces same result', async () => {
		await stormTester(StormTestConfig, async () => {
			const salt = generateHex(32);
			const saltedPassword = hashPasswordWithSalt(salt, 'testpass');
			const account = await ModuleBE_AccountDB.impl.create({email: 'user@example.com', type: 'user'});

			await insertLegacyPasswordFields(account._id, salt, saltedPassword);

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();
			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const credentials = await ModuleBE_PasswordCredentialDB.query.custom({where: {accountId: account._id}, limit: 1});
			expect(credentials).to.have.length(1);
		});
	});

	it('skips accounts without legacy password fields', async () => {
		await stormTester(StormTestConfig, async () => {
			await ModuleBE_AccountDB.impl.create({email: 'nopass@example.com', type: 'user'});

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const allCredentials = await ModuleBE_PasswordCredentialDB.query.custom({where: {}});
			expect(allCredentials).to.have.length(0);
		});
	});

	it('migrates multiple accounts in one run', async () => {
		await stormTester(StormTestConfig, async () => {
			const accounts = await Promise.all([
				ModuleBE_AccountDB.impl.create({email: 'user1@example.com', type: 'user'}),
				ModuleBE_AccountDB.impl.create({email: 'user2@example.com', type: 'user'}),
				ModuleBE_AccountDB.impl.create({email: 'user3@example.com', type: 'user'}),
			]);

			for (const account of accounts) {
				const salt = generateHex(32);
				await insertLegacyPasswordFields(account._id, salt, hashPasswordWithSalt(salt, 'pass'));
			}

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const allCredentials = await ModuleBE_PasswordCredentialDB.query.custom({where: {}});
			expect(allCredentials).to.have.length(3);
		});
	});

	it('cleans legacy fields from service accounts too', async () => {
		await stormTester(StormTestConfig, async () => {
			const salt = generateHex(32);
			const saltedPassword = hashPasswordWithSalt(salt, 'svcpass');
			const svcAccount = await ModuleBE_AccountDB.impl.create({email: 'svc@example.com', type: 'service'});

			await insertLegacyPasswordFields(svcAccount._id, salt, saltedPassword);

			await (ModuleBE_PasswordCredentialDB as any).migrateFromAccounts();

			const rawAccount = await (ModuleBE_AccountDB.collection as any).mongoCollection.findOne({_id: svcAccount._id});
			expect(rawAccount).to.not.have.property('salt');
			expect(rawAccount).to.not.have.property('saltedPassword');
		});
	});
});
