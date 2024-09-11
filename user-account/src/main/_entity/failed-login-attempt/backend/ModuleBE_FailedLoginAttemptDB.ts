import {DBApiConfigV3, ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';
import {
	DB_FailedLoginAttempt,
	DBDef_FailedLoginAttempt,
	DBProto_FailedLoginAttempt,
	DefaultMaxLoginAttempts,
	ErrorType_LoginBlocked
} from '../shared';
import {
	ApiException,
	currentTimeMillis,
	Format_HHmmss_DDMMYYYY,
	formatTimestamp,
	Minute,
	UniqueId
} from '@nu-art/ts-common';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';


type Config = DBApiConfigV3<DBProto_FailedLoginAttempt> & {
	loginBlockedTTL: number;
	maxLoginAttempts: number
}

type LoginBlockedErrorBody = ResponseError<typeof ErrorType_LoginBlocked, {
	blockedUntil: number;
}>

/**
 * Manage and handle login failed attempts,
 * Default login blocked timer is 5 minutes
 */
export class ModuleBE_FailedLoginAttemptDB_Class
	extends ModuleBE_BaseDB<DBProto_FailedLoginAttempt, Config> {

	constructor() {
		super(DBDef_FailedLoginAttempt);
		this.setDefaultConfig({
			loginBlockedTTL: 5 * Minute, // default login block is 5 minutes
			maxLoginAttempts: DefaultMaxLoginAttempts
		});
	}

	//######################### Public Logic #########################

	/**
	 * Failed login attempt handler, will take care of updating or managing
	 * failed login attempt event.
	 * @param accountId The account that failed login.
	 */
	public updateFailedLoginAttempt = async (accountId: UniqueId) => {
		const existingLoginAttempt = await this.query.unique(accountId);

		// if the account doesn't have pre existing document create new.
		if (!existingLoginAttempt)
			return this.createNewLoginAttempt(accountId);

		//if the login is already blocked handled blocked login
		if (existingLoginAttempt.count === this.config.maxLoginAttempts) {

			// if the login is still blocked throw an error
			if (this.validateLoginBlock(existingLoginAttempt))
				return this.handleBlockedLogin(existingLoginAttempt);

			// otherwise start a new count by setting the counter to 0 and continuing the update process
			existingLoginAttempt.count = 0;
		}

		// update the counter
		existingLoginAttempt.count++;

		//update the doc
		const updatedDoc = await this.set.item(existingLoginAttempt);

		// check if login is blocked after the update, if so, handle blocked login
		if (updatedDoc.count === this.config.maxLoginAttempts)
			return this.handleBlockedLogin(updatedDoc);
	};

	/**
	 * After a successful login attempt use this function to validate if user isn't blocked
	 * or if block time elapsed
	 * @param accountId The account that successfully logged in
	 */
	public validateLoginAttempt = async (accountId: UniqueId) => {
		const loginAttempt = await this.query.unique(accountId);

		// fail fast if there's no login attempts document
		if (!loginAttempt)
			return;

		// clean login attempt doc if login is successful and not blocked
		if (loginAttempt.count < this.config.maxLoginAttempts)
			return this.clearLoginAttempt(accountId);

		// if the login is still blocked throw blocked error
		if (this.validateLoginBlock(loginAttempt))
			return this.handleBlockedLogin(loginAttempt);

		// clean blocked login if blocked time elapsed
		return this.clearLoginAttempt(accountId);
	};

	//######################### Internal Logic #########################

	private validateLoginBlock = (loginAttempt: DB_FailedLoginAttempt) => {
		const blockedUntil = loginAttempt.__updated + this.config.loginBlockedTTL;
		return currentTimeMillis() < blockedUntil;
	};

	private clearLoginAttempt = (accountId: UniqueId) => {
		return this.delete.unique(accountId);
	};

	private createNewLoginAttempt = async (accountId: UniqueId) => {
		return this.set.item({
			_id: accountId,
			count: 1
		});
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

