import {DBApiConfigV3, ModuleBE_BaseDB,} from '@nu-art/thunderstorm/backend';
import {
	DBDef_LoginAttempt,
	DBProto_LoginAttempt,
	LoginMetadata,
	LoginStatus,
	LoginStatus_Failed,
	LoginStatus_Success
} from '../shared';
import {filterKeys, UniqueId} from '@nu-art/ts-common';
import {OnLoginFailed} from './dispatchers';
import {OnUserLogin} from '../../account/backend';
import {SafeDB_Account} from '../../account/shared';
import {MemKey_HttpRequest} from '@nu-art/thunderstorm/backend/modules/server/consts';


type Config = DBApiConfigV3<DBProto_LoginAttempt> & {}

/**
 * DB entity that collects login metadata and handles blocking of users that failed
 * login credentials over a number of defined times
 */
export class ModuleBE_LoginAttemptDB_Class
	extends ModuleBE_BaseDB<DBProto_LoginAttempt, Config> implements OnLoginFailed, OnUserLogin {

	/**
	 * Dispatcher that handles failed login events
	 * @param accountId The account id that failed login
	 */
	__onLoginFailed(accountId: string) {
		return this.createLoginAttempt(accountId, LoginStatus_Failed);
	}

	/**
	 * On successful event write successful event
	 * @param account The logged in account id
	 */
	__onUserLogin(account: SafeDB_Account) {
		return this.createLoginAttempt(account._id, LoginStatus_Success);
	}

	constructor() {
		super(DBDef_LoginAttempt);
	}

	/**
	 * Default creator function that creates the db document of a login attempt,
	 * will be called from the dispatcher listeners that will define the attempt status
	 * @param accountId The account that attempted to log-in
	 * @param status The login attempts status
	 */
	private createLoginAttempt = async (accountId: UniqueId, status: LoginStatus) => {
		return this.set.item({
			accountId,
			status,
			metadata: this.collectLoginMetadata()
		});
	};

	/**
	 * Metadata object generator, for now resolving only device id and tries to resolve id (not always possible)
	 */
	private collectLoginMetadata = (): LoginMetadata => {
		const request = MemKey_HttpRequest.get();


		return filterKeys({
			ipAddress: (request.headers['x-forwarded-for'] as string) || request.socket.remoteAddress,
			deviceId: request.body.deviceId
		});
	};
}

export const ModuleBE_LoginAttemptDB = new ModuleBE_LoginAttemptDB_Class();
