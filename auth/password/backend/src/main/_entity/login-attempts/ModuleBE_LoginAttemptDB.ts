import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {
	DatabaseDef_Account,
	DB_Account,
} from '@nu-art/user-account-shared';
import {
	DatabaseDef_LoginAttempt,
	DBDef_LoginAttempt,
	LoginMetadata,
	LoginStatus,
	LoginStatus_Failed,
	LoginStatus_Success,
} from '@nu-art/password-auth-shared';
import {filterKeys} from '@nu-art/ts-common';
import {OnLoginFailed} from './dispatchers.js';
import {MemKey_HttpRequest} from '@nu-art/http-server';
import {OnUserLogin} from '@nu-art/user-account-backend';

export class ModuleBE_LoginAttemptDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_LoginAttempt>
	implements OnLoginFailed, OnUserLogin {

	__onLoginFailed(accountId: DatabaseDef_Account['id']) {
		return this.createLoginAttempt(accountId, LoginStatus_Failed);
	}

	__onUserLogin(account: DB_Account) {
		this.logDebug(`__onUserLogin: recording success for _id='${account._id}'`);
		return this.createLoginAttempt(account._id, LoginStatus_Success);
	}

	constructor() {
		super(DBDef_LoginAttempt);
	}

	private createLoginAttempt = async (accountId: DatabaseDef_Account['id'], status: LoginStatus) => {
		return this.set.item({
			accountId,
			status,
			metadata: this.collectLoginMetadata()
		});
	};

	private collectLoginMetadata = (): LoginMetadata => {
		const request = MemKey_HttpRequest.get();

		return filterKeys({
			ipAddress: (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress,
			deviceId: request.body.deviceId
		});
	};
}

export const ModuleBE_LoginAttemptDB = new ModuleBE_LoginAttemptDB_Class();
