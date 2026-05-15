import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {DatabaseDef_PasswordCredentials, DBDef_PasswordCredentials} from '@nu-art/password-auth-shared';

export class ModuleBE_PasswordCredentialDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_PasswordCredentials> {

	constructor() {
		super(DBDef_PasswordCredentials);
	}
}

export const ModuleBE_PasswordCredentialDB = new ModuleBE_PasswordCredentialDB_Class();
