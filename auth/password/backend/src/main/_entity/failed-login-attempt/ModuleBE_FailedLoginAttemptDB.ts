import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {
	DatabaseDef_Account,
	DB_Account,
} from '@nu-art/user-account-shared';
import {
	DatabaseDef_FailedLoginAttempt,
	DB_FailedLoginAttempt,
	DBDef_FailedLoginAttempt,
	DefaultMaxLoginAttempts,
	ErrorType_LoginBlocked,
} from '@nu-art/password-auth-shared';
import {ApiException, currentTimeMillis, exists, Format_HHmmss_DDMMYYYY, formatTimestamp, Minute} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/api-types';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';
import {dispatch_OnLoginFailed} from '../login-attempts/dispatchers.js';
import {OnUserLogin} from '@nu-art/user-account-backend';


type Config = {
	loginBlockedTTL: number;
	maxLoginAttempts: number;
	documentTTL: number;
}

type LoginBlockedErrorBody = ResponseError<typeof ErrorType_LoginBlocked, {
	blockedUntil: number;
}>

export class ModuleBE_FailedLoginAttemptDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_FailedLoginAttempt, Config>
	implements OnUserLogin {

	constructor() {
		super(DBDef_FailedLoginAttempt);
		this.setDefaultConfig({
			loginBlockedTTL: 5 * Minute,
			maxLoginAttempts: DefaultMaxLoginAttempts,
			documentTTL: 3 * Minute
		});
	}

	__onUserLogin(account: DB_Account) {
		this.logDebug(`__onUserLogin: clearing failed attempts for _id='${account._id}'`);
		return this.onLoginSuccessful(account._id);
	}

	public updateFailedLoginAttempt = async (accountId: DatabaseDef_Account['id']) => {
		const existingLoginAttempt = await this.getExistingLoginAttempt(accountId);

		if (!existingLoginAttempt)
			return this.createNewLoginAttempt(accountId);

		if (this.isLoginBlocked(existingLoginAttempt))
			return this.handleBlockedLogin(existingLoginAttempt);

		if (this.isTTLExpired(existingLoginAttempt) || exists(existingLoginAttempt.loginSuccessfulAt))
			return this.createNewLoginAttempt(accountId);

		return this.incrementLoginAttempt(existingLoginAttempt);
	};

	private onLoginSuccessful = async (accountId: DatabaseDef_Account['id']) => {
		const loginAttempt = await this.getExistingLoginAttempt(accountId);

		if (!loginAttempt)
			return;

		if (loginAttempt.count < this.config.maxLoginAttempts) {
			loginAttempt.loginSuccessfulAt = currentTimeMillis();
			return this.set.item(loginAttempt);
		}

		if (this.assertLoginBlock(loginAttempt))
			return this.handleBlockedLogin(loginAttempt);
	};

	private getExistingLoginAttempt = async (accountId: DatabaseDef_Account['id']) => {
		return (await this.query.custom({
			where: {accountId},
			limit: 1,
			orderBy: [{key: '__created', order: 'desc'}]
		}))[0];
	};

	private isLoginBlocked = (loginAttempt: DB_FailedLoginAttempt) => {
		return loginAttempt.count >= this.config.maxLoginAttempts && this.assertLoginBlock(loginAttempt);
	};

	private isTTLExpired = (loginAttempt: DB_FailedLoginAttempt) => {
		return loginAttempt.__created + this.config.documentTTL < currentTimeMillis();
	};

	private incrementLoginAttempt = async (loginAttempt: DB_FailedLoginAttempt) => {
		loginAttempt.count++;
		const updatedDoc = await this.set.item(loginAttempt);
		await dispatch_OnLoginFailed.dispatchModuleAsync(loginAttempt.accountId);

		if (updatedDoc.count >= this.config.maxLoginAttempts)
			return this.handleBlockedLogin(updatedDoc);
	};

	private assertLoginBlock = (loginAttempt: DB_FailedLoginAttempt) => {
		const blockedUntil = loginAttempt.__updated + this.config.loginBlockedTTL;
		return currentTimeMillis() < blockedUntil;
	};

	private createNewLoginAttempt = async (accountId: DatabaseDef_Account['id']) => {
		return Promise.all([this.set.item({
			accountId: accountId,
			count: 1
		}), dispatch_OnLoginFailed.dispatchModuleAsync(accountId)]);
	};

	private handleBlockedLogin = (blockedLogin: DB_FailedLoginAttempt) => {
		const loginBlockedUntil = blockedLogin.__updated + this.config.loginBlockedTTL;
		throw new ApiException<LoginBlockedErrorBody>(HttpCodes._4XX.FORBIDDEN.code,
			`Login is blocked until ${formatTimestamp(Format_HHmmss_DDMMYYYY, loginBlockedUntil)}`).setErrorBody({
			type: ErrorType_LoginBlocked,
			data: {blockedUntil: loginBlockedUntil}
		});
	};
}

export const ModuleBE_FailedLoginAttemptDB = new ModuleBE_FailedLoginAttemptDB_Class();
