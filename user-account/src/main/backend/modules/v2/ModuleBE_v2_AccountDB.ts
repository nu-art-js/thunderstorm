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

	private async spiceAccount(request: Request_CreateAccount) {
		const email = request.email.toLowerCase(); //Email always lowerCase
		const salt = generateHex(32);
		return {
			email: email,
			salt,
			saltedPassword: hashPasswordWithSalt(salt, request.password)
		};
	}

	listUsers = async (transaction?: Transaction) => {
		return (await this.query.custom({select: ['_id', 'email']}, transaction)) as { email: string, _id: string }[];
	};

	/**
	 * todo Check if necessary
	 */
	async getUser(_email: string): Promise<UI_Account | undefined> {
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
	 * todo Check if necessary
	 */
	async getSession(_email: string) {
		//Email always lowerCase
		const email = _email.toLowerCase();
		return this.query.uniqueCustom({where: {email}});
	}

	account = {
		register: async (body: RequestBody_CreateAccount, transaction?: Transaction): Promise<Response_Auth> => {
			if (!this.config.canRegister)
				throw new ApiException(418, 'Registration is disabled!!');

			this.assertPasswordRules(body.password);

			//Email always lowerCase
			body.email = body.email.toLowerCase();
			MemKey_AccountEmail.set(body.email); // set here, because MemKey_AccountEmail is needed in createAccountImpl

			//Create the account
			const account = await this.createAccountImpl(body, transaction);
			const uiAccount = getUIAccount(account);

			//Log in
			const session = await ModuleBE_v2_SessionDB.upsertSession(uiAccount);

			//Update whoever listens
			await dispatch_onNewUserRegistered.dispatchModuleAsync(uiAccount);
			await dispatch_onUserLogin.dispatchModuleAsync(uiAccount);

			//Finish
			return session;
		},
		login: async (request: Request_LoginAccount): Promise<Response_Auth> => {
			const {account, session} = await this.loginImpl(request);

			await dispatch_onUserLogin.dispatchModuleAsync(getUIAccount(account));
			return session;
		},
	};

	async loginImpl(request: Request_LoginAccount, transaction?: Transaction) {
		request.email = request.email.toLowerCase();
		const account = await this.assertPasswordMatch(request.password, request.email);

		const session = await ModuleBE_v2_SessionDB.upsertSession(account);
		return {account, session};
	}

	async createAccount(body: RequestBody_CreateAccount, transaction?: Transaction): Promise<Response_Auth> {
		const dbAccount = await this.createAccountImpl(body, transaction);
		return {...getUIAccount(dbAccount), sessionId: (await this.account.login(body)).sessionId};
	}

	private createAccountImpl = async (body: RequestBody_CreateAccount, transaction?: Transaction): Promise<DB_Account_V2> => {
		//Email always lowerCase
		body.email = body.email.toLowerCase();
		this.assertPasswordRules(body.password);

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

			const account = await this.spiceAccount(body) as PreDB<DB_Account_V2>;
			return await this.create.item(account, transaction);
		}, transaction);
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

			const assertedAccount = await this.assertPasswordMatch(originalPassword, userEmail);

			if (!compare(newPassword, newPassword_check))
				throw new ApiException(401, 'Account login using SAML');

			const updatedAccount = await this.spiceAccount({
				email: userEmail,
				password: newPassword,
				password_check: newPassword
			});

			//Update the account with a new password
			return this.set.item({...assertedAccount, ...updatedAccount});
		}, transaction);
	}

	private assertPasswordRules(password: string) {
		const assertPassword = assertPasswordRules(password, this.config.passwordAssertion);
		if (assertPassword)
			throw new ApiException(444, `Password assertion failed with: ${__stringify(assertPassword)}`);
	}

	private async assertPasswordMatch(password: string, userEmail: string, transaction?: Transaction) {
		const account = await this.query.uniqueCustom({where: {email: userEmail}}, transaction);

		if (!account) {
			await dispatch_onApplicationException.dispatchModuleAsync(new ApiException(401, `There is no account for email '${userEmail}'.`), this);
			throw new ApiException(401, 'Wrong username or password.');
		}

		if (!account.salt || !account.saltedPassword)
			throw new ApiException(401, 'Account was never logged in using username and password, probably logged using SAML');

		if (hashPasswordWithSalt(password, account.salt) !== account.saltedPassword)
			throw new ApiException(401, 'Wrong username or password.');

		return account;
	}

}

export function getUIAccount(account: DB_Account_V2): UI_Account {
	const {email, _id} = account;
	return {email, _id};
}

export const ModuleBE_v2_AccountDB = new ModuleBE_v2_AccountDB_Class();