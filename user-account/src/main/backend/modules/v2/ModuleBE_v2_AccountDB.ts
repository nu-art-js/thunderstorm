import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {
	DB_Account_V2,
	DBDef_Account,
	RequestBody_ChangePassword,
	RequestBody_CreateAccount,
	Response_Auth
} from '../../../shared/v2';
import {
	__stringify,
	ApiException,
	compare,
	dispatch_onApplicationException,
	Dispatcher,
	generateHex,
	hashPasswordWithSalt,
	PreDB
} from '@nu-art/ts-common';
import {MemKey_AccountEmail} from '../../core/accounts-middleware';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {ModuleBE_v2_SessionDB} from './ModuleBE_v2_SessionDB';
import {Request_CreateAccount, Request_LoginAccount, UI_Account} from '../../../shared/api';
import {assertPasswordRules, PasswordAssertionConfig} from '../../../shared/v2/assertion';
import {firestore} from 'firebase-admin';
import Transaction = firestore.Transaction;


export interface OnNewUserRegistered {
	__onNewUserRegistered(account: UI_Account): void;
}

export interface OnUserLogin {
	__onUserLogin(account: UI_Account): void;
}

export const dispatch_onUserLogin = new Dispatcher<OnUserLogin, '__onUserLogin'>('__onUserLogin');

const dispatch_onNewUserRegistered = new Dispatcher<OnNewUserRegistered, '__onNewUserRegistered'>('__onNewUserRegistered');

type Config = DBApiConfig<DB_Account_V2> & {
	canRegister: boolean
	passwordAssertion?: PasswordAssertionConfig
}

export class ModuleBE_v2_AccountDB_Class
	extends ModuleBE_BaseDBV2<DB_Account_V2, Config> {
	constructor() {
		super(DBDef_Account);
	}

	protected async preWriteProcessing(dbInstance: PreDB<DB_Account_V2>, transaction?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountEmail.get();
	}

	private spiceAccount(request: Request_CreateAccount) {
		const email = request.email.toLowerCase(); //Email always lowerCase
		const salt = generateHex(32);
		return {
			email: email,
			salt,
			saltedPassword: hashPasswordWithSalt(salt, request.password)
		};
	}

	/**
	 * todo legacy code from old module- Potential for improvement
	 */
	listUsers = async (transaction?: Transaction) => {
		return (await this.query.custom({select: ['_id', 'email']}, transaction)) as { email: string, _id: string }[];
	};

	async getUIAccountByEmail(_email: string): Promise<UI_Account | undefined> {
		//Email always lowerCase
		const email = _email.toLowerCase();
		return this.query.uniqueCustom({where: {email}, select: ['email', '_id']});
	}

	/**
	 * Create an account without passing through this.spiceAccount - as in without password/salt,
	 * for loginSaml initial login
	 */
	getOrCreate = async (query: { where: { email: string } }): Promise<DB_Account_V2> => {
		let dispatchEvent = false;

		const dbAccount = await this.runTransaction(async (transaction: Transaction) => {
			const account = await this.query.uniqueCustom(query, transaction);
			if (account)
				return account;

			const _account: PreDB<DB_Account_V2> = {
				email: query.where.email,
			} as PreDB<DB_Account_V2>;

			dispatchEvent = true;
			return this.create.item(_account); // this.createAccountImpl requires pw/salt and also redundantly rechecks if the account doesn't exist.
		});

		if (dispatchEvent)
			await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccount(dbAccount));

		return dbAccount;
	};

	/**
	 * todo legacy code from old module- necessary?
	 */
	async getAccountByEmail(_email: string) {
		//Email always lowerCase
		const email = _email.toLowerCase();
		return this.query.uniqueCustom({where: {email}});
	}

	account = {
		register: async (body: RequestBody_CreateAccount, transaction?: Transaction): Promise<Response_Auth> => {
			if (!this.config.canRegister)
				throw new ApiException(418, 'Registration is disabled!!');

			this.password.assertPasswordRules(body.password);

			//Email always lowerCase
			body.email = body.email.toLowerCase();
			MemKey_AccountEmail.set(body.email); // set here, because MemKey_AccountEmail is needed in createAccountImpl

			//Create the account
			const account = await this.createAccountImpl(body, true, transaction); // Must have a password, because we use it to auto-login immediately after
			const uiAccount = getUIAccount(account);

			//Log in
			const session = await ModuleBE_v2_SessionDB.upsertSession(uiAccount);

			//Update whoever listens
			await dispatch_onNewUserRegistered.dispatchModuleAsync(uiAccount);
			await dispatch_onUserLogin.dispatchModuleAsync(uiAccount);

			//Finish
			return session;
		},
		login: async (request: Request_LoginAccount, transaction?: Transaction): Promise<Response_Auth> => {
			const {account, session} = await this.loginImpl(request, transaction);

			await dispatch_onUserLogin.dispatchModuleAsync(getUIAccount(account));
			return session;
		},
		create: async (request: Request_CreateAccount, transaction?: Transaction) => {
			await this.createAccountImpl(request, false, transaction);
		}
	};

	password = {
		assertPasswordExistence: (email: string, password?: string, password_check?: string) => {
			if (!password || !password_check)
				throw new ApiException(400, `Did not receive a password for email ${email}.`);

			if (password !== password_check)
				throw new ApiException(400, `Password does not match password check for email ${email}.`);
		},
		assertPasswordRules: (password: string) => {
			const assertPassword = assertPasswordRules(password, this.config.passwordAssertion);
			if (assertPassword)
				throw new ApiException(444, `Password assertion failed with: ${__stringify(assertPassword)}`);
		},
		assertPasswordMatch: async (password: string, userEmail: string, transaction?: Transaction) => {
			const account = await this.query.uniqueCustom({where: {email: userEmail}}, transaction);

			if (!account) {
				await dispatch_onApplicationException.dispatchModuleAsync(new ApiException(401, `There is no account for email '${userEmail}'.`), this);
				throw new ApiException(401, 'Wrong username or password.');
			}

			if (!account.salt || !account.saltedPassword)
				throw new ApiException(401, 'Account was never logged in using username and password, probably logged using SAML');

			if (hashPasswordWithSalt(account.salt, password) !== account.saltedPassword)
				throw new ApiException(401, 'Wrong username or password.');

			return account;
		}
	};

	private async loginImpl(request: Request_LoginAccount, transaction?: Transaction) {
		request.email = request.email.toLowerCase();
		const account = await this.password.assertPasswordMatch(request.password, request.email, transaction);

		const session = await ModuleBE_v2_SessionDB.upsertSession(account, transaction);
		return {account, session};
	}


	// private createAccountImpl = async (body: RequestBody_CreateAccount, transaction?: Transaction): Promise<DB_Account_V2> => {
	// 	//Email always lowerCase
	// 	body.email = body.email.toLowerCase();
	// 	this.password.assertPasswordRules(body.password);
	//
	// 	return this.runTransaction(async _transaction => {
	// 		let existingAccount: DB_Account_V2 | undefined;
	// 		try {
	// 			existingAccount = await this.query.uniqueWhere({email: body.email}, transaction);
	// 		} catch (ignore) {
	// 			// this is fine we do not want the account to exist!
	// 			/* empty */
	// 		}
	//
	// 		if (existingAccount)
	// 			throw new ApiException(422, 'User with email already exists');
	//
	// 		const account = this.spiceAccount(body) as PreDB<DB_Account_V2>;
	// 		return await this.create.item(account, transaction);
	// 	}, transaction);
	// };


	private createAccountImpl = async (body: RequestBody_CreateAccount, passwordRequired?: boolean, transaction?: Transaction) => {
		//Email always lowerCase
		body.email = body.email.toLowerCase();

		// If login SAML or admin creates an account - it doesn't necessarily receive a password yet.
		let account = {email: body.email};

		if (body.password || body.password_check || passwordRequired) {
			this.password.assertPasswordExistence(body.email, body.password, body.password_check);
			this.password.assertPasswordRules(body.password);

			account = this.spiceAccount(body);
		}

		return this.runTransaction(async _transaction => {
			let existingAccount: DB_Account_V2 | undefined;

			try {
				existingAccount = await this.query.uniqueWhere({email: body.email}, transaction);
			} catch (ignore) {
				// this is fine we do not want the account to exist!
				/* empty */
			}

			if (existingAccount)
				throw new ApiException(422, 'User with email already exists');

			return await this.create.item(account as PreDB<DB_Account_V2>, transaction);
		});
	};

	async changePassword(body: RequestBody_ChangePassword, transaction?: Transaction): Promise<Response_Auth> {
		const lowerCaseEmail = body.userEmail.toLowerCase();
		const updatedAccount = await this.changePasswordImpl(lowerCaseEmail, body.originalPassword, body.newPassword, body.newPassword_check, transaction);
		return {
			...getUIAccount(updatedAccount),
			sessionId: (await this.account.login({
				email: lowerCaseEmail,
				password: body.newPassword
			})).sessionId
		};
	}

	private async changePasswordImpl(userEmail: string, originalPassword: string, newPassword: string, newPassword_check: string, transaction?: Transaction) {
		return await this.runTransaction(async (_transaction) => {

			const assertedAccount = await this.password.assertPasswordMatch(originalPassword, userEmail);

			if (!compare(newPassword, newPassword_check))
				throw new ApiException(401, 'Account login using SAML');

			const updatedAccount = this.spiceAccount({
				email: userEmail,
				password: newPassword,
				password_check: newPassword
			});

			//Update the account with a new password
			return this.set.item({...assertedAccount, ...updatedAccount});
		}, transaction);
	}
}

export function getUIAccount(account: DB_Account_V2): UI_Account {
	const {email, _id} = account;
	return {email, _id};
}

export const ModuleBE_v2_AccountDB = new ModuleBE_v2_AccountDB_Class();