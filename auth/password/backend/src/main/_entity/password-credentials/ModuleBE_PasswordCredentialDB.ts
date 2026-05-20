import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PasswordCredentials, DBDef_PasswordCredentials, UI_PasswordCredentials} from '@nu-art/password-auth-shared';
import {ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import {DB_Account} from '@nu-art/user-account-shared';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';

type LegacyPasswordFields = {
	salt?: string;
	saltedPassword?: string;
	_newPasswordRequired?: boolean;
};

export class ModuleBE_PasswordCredentialDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PasswordCredentials> {

	constructor() {
		super(DBDef_PasswordCredentials);
	}

	async init() {
		super.init();
		await new MemStorage().init(() => this.migrateFromAccounts());
	}

	private async migrateFromAccounts() {
		const allAccounts = await ModuleBE_AccountDB.query.custom({where: {}});
		const accountsWithPassword = allAccounts.filter(account => {
			const raw = account as DB_Account & LegacyPasswordFields;
			return raw.salt && raw.saltedPassword;
		});

		if (accountsWithPassword.length === 0) {
			this.logDebug('No accounts with legacy password fields — migration not needed');
			return;
		}

		this.logWarning(`Found ${accountsWithPassword.length} accounts with legacy password fields — migrating`);

		const existingCredentials = await this.query.custom({where: {}});
		const migratedAccountIds = new Set(existingCredentials.map(c => c.accountId));

		const credentialsToCreate: UI_PasswordCredentials[] = [];
		let skipped = 0;

		for (const account of accountsWithPassword) {
			if (account.type === 'service') {
				skipped++;
				continue;
			}

			if (migratedAccountIds.has(account._id)) {
				skipped++;
				continue;
			}

			const raw = account as DB_Account & LegacyPasswordFields;
			credentialsToCreate.push({
				accountId: account._id,
				salt: raw.salt!,
				saltedPassword: raw.saltedPassword!,
				_newPasswordRequired: raw._newPasswordRequired,
			});
		}

		if (credentialsToCreate.length > 0)
			await this.create.all(credentialsToCreate);

		const accountsToClean = accountsWithPassword.map(account => {
			const cleaned = {...account};
			delete (cleaned as DB_Account & LegacyPasswordFields).salt;
			delete (cleaned as DB_Account & LegacyPasswordFields).saltedPassword;
			delete (cleaned as DB_Account & LegacyPasswordFields)._newPasswordRequired;
			return cleaned;
		});

		await ModuleBE_AccountDB.set.all(accountsToClean);

		this.logWarning(`Migration complete: created=${credentialsToCreate.length} skipped=${skipped} cleaned=${accountsWithPassword.length}`);
	}
}

export const ModuleBE_PasswordCredentialDB = new ModuleBE_PasswordCredentialDB_Class();
