import {ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {
	_SessionKey_Account,
	ApiDefBE_AccountV2,
	DB_Account_V2,
	DBDef_Account,
	Request_CreateAccount,
	Request_LoginAccount,
	Request_RegisterAccount,
	RequestBody_ChangePassword,
	RequestBody_RegisterAccount,
	RequestBody_CreateToken,
	RequestBody_SetPassword,
	Response_Auth,
	UI_Account
} from '../../../shared';
import {
	__stringify,
	ApiException,
	BadImplementationException,
	cloneObj,
	compare,
	dispatch_onApplicationException,
	Dispatcher,
	DontCallthisException,
	generateHex,
	hashPasswordWithSalt,
	MUSTNeverHappenException,
	PreDB
} from '@nu-art/ts-common';
import {DBApiConfig} from '@nu-art/db-api-generator/backend';
import {
	CollectSessionData,
	Header_SessionId,
	MemKey_AccountEmail,
	MemKey_AccountId,
	ModuleBE_v2_SessionDB,
	SessionKey_BE,
	SessionKey_Session_BE
} from './ModuleBE_v2_SessionDB';
import {assertPasswordRules, PasswordAssertionConfig} from '../../../shared/assertion';
import {firestore} from 'firebase-admin';
import {QueryParams} from '@nu-art/thunderstorm';
import {addRoutes, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {FirestoreInterfaceV2} from '@nu-art/firebase/backend/firestore-v2/FirestoreInterfaceV2';
import {FirestoreType_DocumentSnapshot} from '@nu-art/firebase/backend';
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


export const SessionKey_Account_BE = new SessionKey_BE<_SessionKey_Account>('account');

export class ModuleBE_v2_AccountDB_Class
	extends ModuleBE_BaseDBV2<DB_Account_V2, Config>
	implements CollectSessionData<_SessionKey_Account> {

	readonly Middleware = async () => {
		const account = SessionKey_Account_BE.get();
		MemKey_AccountEmail.set(account.email);
		MemKey_AccountId.set(account._id);
	};

	constructor() {
		super(DBDef_Account);
	}

	manipulateQuery(query: FirestoreQuery<DB_Account_V2>): FirestoreQuery<DB_Account_V2> {
		return {...query, select: ['email', '_newPasswordRequired', 'type', '_id', 'thumbnail', 'displayName', '_auditorId']};
	}

	canDeleteItems(dbItems: DB_Account_V2[], transaction?: FirebaseFirestore.Transaction): Promise<void> {
		throw new DontCallthisException('Cannot delete accounts yet');
	}

	async __collectSessionData(accountId: string) {
		const account = await this.query.uniqueAssert(accountId);
		return {
			key: 'account' as const,
			value: {
				...account as UI_Account,
				hasPassword: !!account.saltedPassword,
			},
		};
	}

	init() {
		super.init();

		addRoutes([
			createBodyServerApi(ApiDefBE_AccountV2.vv1.registerAccount, ModuleBE_v2_AccountDB.account.register),
			createBodyServerApi(ApiDefBE_AccountV2.vv1.changePassword, ModuleBE_v2_AccountDB.changePassword),
			createBodyServerApi(ApiDefBE_AccountV2.vv1.login, ModuleBE_v2_AccountDB.account.login),
			createBodyServerApi(ApiDefBE_AccountV2.vv1.createAccount, ModuleBE_v2_AccountDB.account.create),
			createQueryServerApi(ApiDefBE_AccountV2.vv1.logout, ModuleBE_v2_AccountDB.account.logout),
			createBodyServerApi(ApiDefBE_AccountV2.vv1.createToken, ModuleBE_v2_AccountDB.createToken),
			createBodyServerApi(ApiDefBE_AccountV2.vv1.setPassword, ModuleBE_v2_AccountDB.setPassword)
		]);
	}

	protected async preWriteProcessing(dbInstance: PreDB<DB_Account_V2>, transaction?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountEmail.get();
	}

	private spiceAccount(request: Request_RegisterAccount): PreDB<DB_Account_V2> {
		const email = request.email.toLowerCase(); //Email always lowerCase
		const salt = generateHex(32);
		return {
			email: email,
			type: request.type,
			salt,
			saltedPassword: hashPasswordWithSalt(salt, request.password)
		} as PreDB<DB_Account_V2>;
	}

	/**
	 * Create an account without passing through this.spiceAccount - as in without password/salt,
	 * for loginSaml initial login
	 */
	getOrCreate = async (query: { where: { email: string } }): Promise<DB_Account_V2> => {
		let dispatchEvent = false;

		const dbAccount = await this.runTransaction(async (transaction: Transaction) => {
			let account;
			try {
				account = await this.query.uniqueCustom(query, transaction);
			} catch (err) {
				const _account: PreDB<DB_Account_V2> = {
					email: query.where.email,
					type: 'user'
				} as PreDB<DB_Account_V2>;

				dispatchEvent = true;
				account = this.create.item(_account, transaction); // this.createAccountImpl requires pw/salt and also redundantly rechecks if the account doesn't exist.
			}
			return account;
		});

		if (dispatchEvent)
			await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccount(dbAccount));

		return dbAccount;
	};

	account = {
		register: async (body: RequestBody_RegisterAccount, transaction?: Transaction): Promise<Response_Auth> => {
			if (!this.config.canRegister)
				throw new ApiException(418, 'Registration is disabled!!');

			// this flow is for user accounts
			(body as Request_RegisterAccount).type = 'user';

			this.password.assertPasswordRules(body.password);

			//Email always lowerCase
			body.email = body.email.toLowerCase();
			MemKey_AccountEmail.set(body.email); // set here, because MemKey_AccountEmail is needed in createAccountImpl

			//Create the account
			const uiAccount = await this.createAccountImpl(body as Request_RegisterAccount, true, transaction); // Must have a password, because we use it to auto-login immediately after
			this.logErrorBold('uiAccount', uiAccount);
			await dispatch_onNewUserRegistered.dispatchModuleAsync(uiAccount);

			//Log in
			const session = await ModuleBE_v2_SessionDB.getOrCreateSession(uiAccount);

			//Update whoever listens
			await dispatch_onUserLogin.dispatchModuleAsync(uiAccount);

			//Finish
			return session;
		},
		login: async (request: Request_LoginAccount, transaction?: Transaction): Promise<Response_Auth> => {
			const {account, session} = await this.loginImpl(request, transaction);

			await dispatch_onUserLogin.dispatchModuleAsync(getUIAccount(account));
			return session;
		},
		create: async (request: PreDB<UI_Account> & { password?: string }, transaction?: Transaction) => {
			if (request.type === 'user') {
				if (request.password) {
					const uiAccount = await this.createAccountImpl(request, true, transaction);
					await dispatch_onNewUserRegistered.dispatchModuleAsync(uiAccount);
					return uiAccount;
				}

				throw new BadImplementationException('Trying to create a user from type user without password provided');
			}

			const uiAccount = await this.createAccountImpl(request, false, transaction);
			await dispatch_onNewUserRegistered.dispatchModuleAsync(uiAccount);
			return uiAccount;
		},
		logout: async (queryParams: QueryParams) => {
			const sessionId = Header_SessionId.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await ModuleBE_v2_SessionDB.delete.query({where: {sessionId}});
		},
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
			const account = await this.queryAccountWithPassword(userEmail, transaction);
			if (!account.salt || !account.saltedPassword)
				throw new ApiException(401, 'Account was never logged in using username and password, probably logged using SAML');

			if (hashPasswordWithSalt(account.salt, password) !== account.saltedPassword)
				throw new ApiException(401, 'Wrong username or password.');

			return account;
		}
	};

	private async queryAccountWithPassword(userEmail: string, transaction?: Transaction) {
		const firestoreQuery = FirestoreInterfaceV2.buildQuery<DB_Account_V2>(this.collection, {where: {email: userEmail}});
		let results;
		if (transaction)
			results = (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<DB_Account_V2>[];
		else
			results = (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<DB_Account_V2>[];

		if (results.length !== 1)
			if (results.length === 0) {
				await dispatch_onApplicationException.dispatchModuleAsync(new ApiException(401, `There is no account for email '${userEmail}'.`), this);
				throw new ApiException(401, 'Wrong username or password.');
			} else if (results.length > 1) {
				throw new MUSTNeverHappenException('Too many users');
			}

		return results[0].data();
	}

	private async loginImpl(request: Request_LoginAccount, transaction?: Transaction) {
		request.email = request.email.toLowerCase();
		const account = await this.password.assertPasswordMatch(request.password, request.email, transaction);

		const session = await ModuleBE_v2_SessionDB.getOrCreateSession(account, transaction);
		return {account, session};
	}

	private createAccountImpl = async (body: Request_CreateAccount, passwordRequired?: boolean, transaction?: Transaction) => {
		//Email always lowerCase
		body.email = body.email.toLowerCase();

		// If login SAML or admin creates an account - it doesn't necessarily receive a password yet.
		let account = {email: body.email, type: body.type} as PreDB<DB_Account_V2>;

		// TODO: this logic seems faulty.. need to re-done
		if (body.password || body.password_check || passwordRequired) {
			this.password.assertPasswordExistence(body.email, body.password, body.password_check);
			this.password.assertPasswordRules(body.password!);

			account = this.spiceAccount(body as Request_RegisterAccount);
			if (!passwordRequired)
				account._newPasswordRequired = true;
		}

		return getUIAccount(await this.runTransaction(async _transaction => {
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
		}, transaction));
	};

	private async createToken({accountId, ttl}: RequestBody_CreateToken) {
		const {_id} = await ModuleBE_v2_SessionDB.createSession(accountId, (sessionData) => {
			SessionKey_Session_BE.get(sessionData).expiration = ttl;
			return sessionData;
		});


		return {token: _id};
	}

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
				type: 'user',
				email: userEmail,
				password: newPassword,
				password_check: newPassword
			});

			//Update the account with a new password
			return this.set.item({...assertedAccount, ...updatedAccount});
		}, transaction);
	}

	async setPassword(body: RequestBody_SetPassword, transaction?: Transaction): Promise<Response_Auth> {
		const lowerCaseEmail = body.userEmail.toLowerCase();
		const updatedAccount = await this.setPasswordImpl(body.userEmail, body.password, body.password_check, transaction);
		return {
			...getUIAccount(updatedAccount),
			sessionId: (await this.account.login({
				email: lowerCaseEmail,
				password: body.password
			})).sessionId
		};
	}

	private async setPasswordImpl(userEmail: string, password: string, password_check: string, transaction?: Transaction) {
		return await this.runTransaction(async (_transaction) => {

			const existingAccount = await this.queryAccountWithPassword(userEmail, transaction);

			if (!compare(password, password_check))
				throw new ApiException(401, 'Password and password check do not match');

			const updatedAccount = this.spiceAccount({
				type: 'user',
				email: userEmail,
				password,
				password_check,
			});

			//Update the account with a new password
			return this.set.item({...existingAccount, ...updatedAccount});
		}, transaction);
	}
}

export function getUIAccount(account: DB_Account_V2): UI_Account {
	const uiAccount = cloneObj(account);
	delete uiAccount.salt;
	delete uiAccount.saltedPassword;
	return uiAccount as UI_Account;
}

export const ModuleBE_v2_AccountDB = new ModuleBE_v2_AccountDB_Class();