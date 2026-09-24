import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PasswordCredentials, DB_PasswordCredentials, DBDef_PasswordCredentials, UI_PasswordCredentials} from '@nu-art/password-auth-shared';
import {OnDispatch} from '@nu-art/ts-common';
import {DispatchKey_AccountPasswordCredentials, graph_OnAccountDeleted, ModuleBE_AccountDB, type OnAccountDeleted} from '@nu-art/user-account-backend';
import {DB_Account} from '@nu-art/user-account-shared';
import {GroupId_BootstrapServiceAccount, ModuleBE_Permissions, ServiceAccountId_Bootstrap} from '@nu-art/permissions-backend';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';

type LegacyPasswordFields = {
	salt?: string;
	saltedPassword?: string;
	_newPasswordRequired?: boolean;
};

export class ModuleBE_PasswordCredentialDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PasswordCredentials>
	implements OnAccountDeleted {

	constructor() {
		super(DBDef_PasswordCredentials);
	}

	async init() {
		super.init();
		ModuleBE_Permissions.setAccessContextResolver(this, item => this.accessForAccount(item.accountId));
		await new MemStorage().init(() => this.migrateFromAccounts());
	}

	/**
	 * __access should be this account id too, not only bootstrap.
	 * Registration runs as the bootstrap SA, so the default stamp is bootstrap-only
	 * and a signed-in query misses the row.
	 */
	private accessForAccount(accountId: DB_Account['_id']) {
		return {
			__access: {
				readers: [accountId, GroupId_BootstrapServiceAccount],
				writers: [accountId, GroupId_BootstrapServiceAccount],
				creators: [],
				deleters: [GroupId_BootstrapServiceAccount],
				owners: [accountId],
			}
		};
	}

	protected async preWriteProcessing(dbInstance: UI_PasswordCredentials): Promise<void> {
		Object.assign(dbInstance, this.accessForAccount(dbInstance.accountId));
	}

	async queryByAccountId(accountId: DB_Account['_id']): Promise<DB_PasswordCredentials | undefined> {
		const read = async () => (await this.query.custom({where: {accountId}, limit: 1}))[0];
		const visible = await read();
		if (visible)
			return visible;

		const repaired = await ModuleBE_Permissions.runAsServiceAccount(ServiceAccountId_Bootstrap, async () => {
			const existing = await read();
			if (!existing)
				return false;

			await ModuleBE_Permissions.share(DBDef_PasswordCredentials.dbKey, existing._id, {
				readers: [accountId],
				writers: [accountId],
				owners: [accountId],
			});
			return true;
		});

		return repaired ? read() : undefined;
	}

	@OnDispatch(graph_OnAccountDeleted, {key: DispatchKey_AccountPasswordCredentials})
	async __onAccountDeleted(account: DB_Account): Promise<void> {
		const credentials = await this.query.unManipulatedQuery({where: {accountId: account._id}});
		for (const credential of credentials)
			await this.delete.unique(credential._id);
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
