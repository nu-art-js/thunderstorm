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
	MUSTNeverHappenException
} from '@nu-art/ts-common';
import {CollectSessionData, ModuleBE_SessionDB} from './ModuleBE_SessionDB';
import {firestore} from 'firebase-admin';
import {QueryParams} from '@nu-art/thunderstorm';
import {
	addRoutes,
	createBodyServerApi,
	createQueryServerApi,
	DBApiConfigV3,
	ModuleBE_BaseDBV3
} from '@nu-art/thunderstorm/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {FirestoreInterfaceV3} from '@nu-art/firebase/backend/firestore-v3/FirestoreInterfaceV3';
import {FirestoreType_DocumentSnapshot} from '@nu-art/firebase/backend';
import {
	Header_SessionId,
	MemKey_AccountEmail,
	MemKey_AccountId,
	SessionKey_Account_BE,
	SessionKey_Session_BE
} from '../core/consts';
import {
	_SessionKey_Account,
	ApiDefBE_Account,
	DB_Account,
	DBDef_Accounts,
	DBProto_AccountType,
	Request_CreateAccount,
	Request_LoginAccount,
	Request_RegisterAccount,
	RequestBody_ChangePassword,
	RequestBody_CreateToken,
	RequestBody_RegisterAccount,
	RequestBody_SetPassword,
	Response_Auth,
	UI_Account
} from '../../shared';
import {assertPasswordRules, PasswordAssertionConfig} from '../../shared/assertion';
import Transaction = firestore.Transaction;


export interface OnNewUserRegistered {
	__onNewUserRegistered(account: DB_Account): void;
}

export interface OnUserLogin {
	__onUserLogin(account: DB_Account): void;
}

export const dispatch_onUserLogin = new Dispatcher<OnUserLogin, '__onUserLogin'>('__onUserLogin');

const dispatch_onNewUserRegistered = new Dispatcher<OnNewUserRegistered, '__onNewUserRegistered'>('__onNewUserRegistered');

type Config = DBApiConfigV3<DBProto_AccountType> & {
	canRegister: boolean
	passwordAssertion?: PasswordAssertionConfig
}

export class ModuleBE_AccountDB_Class
	extends ModuleBE_BaseDBV3<DBProto_AccountType, Config>
	implements CollectSessionData<_SessionKey_Account> {

	readonly Middleware = async () => {
		const account = SessionKey_Account_BE.get();
		MemKey_AccountEmail.set(account.email);
		MemKey_AccountId.set(account._id);
	};

	constructor() {
		super(DBDef_Accounts);
	}

	manipulateQuery(query: FirestoreQuery<DB_Account>): FirestoreQuery<DB_Account> {
		return {
			...query,
			select: ['email', '_newPasswordRequired', 'type', '_id', 'thumbnail', 'displayName', '_auditorId']
		};
	}

	canDeleteItems(dbItems: DB_Account[], transaction?: FirebaseFirestore.Transaction): Promise<void> {
		throw new DontCallthisException('Cannot delete accounts yet');
	}

	async __collectSessionData(accountId: string) {
		const account = await this.query.uniqueAssert(accountId);
		return {
			key: 'account' as const,
			value: {
				...account as DB_Account,
				hasPassword: !!account.saltedPassword,
			},
		};
	}

	init() {
		super.init();

		addRoutes([
			createBodyServerApi(ApiDefBE_Account.vv1.registerAccount, this.account.register),
			createBodyServerApi(ApiDefBE_Account.vv1.changePassword, this.changePassword),
			createBodyServerApi(ApiDefBE_Account.vv1.login, this.account.login),
			createBodyServerApi(ApiDefBE_Account.vv1.createAccount, this.account.create),
			createQueryServerApi(ApiDefBE_Account.vv1.logout, this.account.logout),
			createBodyServerApi(ApiDefBE_Account.vv1.createToken, this.createToken),
			createBodyServerApi(ApiDefBE_Account.vv1.setPassword, this.setPassword)
		]);
	}

	protected async preWriteProcessing(dbInstance: UI_Account, transaction?: Transaction): Promise<void> {
		try {
			dbInstance._auditorId = MemKey_AccountId.get();
		} catch (e) {
			dbInstance._auditorId = dbInstance._id;
		}
	}

	private spiceAccount(request: Request_RegisterAccount): UI_Account {
		const email = request.email.toLowerCase(); //Email always lowerCase
		const salt = generateHex(32);
		return {
			email: email,
			type: request.type,
			salt,
			saltedPassword: hashPasswordWithSalt(salt, request.password)
		} as UI_Account;
	}

	/**
	 * Create an account without passing through this.spiceAccount - as in without password/salt,
	 * for loginSaml initial login
	 */
	getOrCreate = async (query: { where: { email: string } }): Promise<DB_Account> => {
		let dispatchEvent = false;

		const dbAccount = await this.runTransaction(async (transaction: Transaction) => {
			let account;
			try {
				account = await this.query.uniqueCustom(query, transaction);
			} catch (err) {
				const _account: UI_Account = {
					email: query.where.email,
					type: 'user'
				} as UI_Account;

				dispatchEvent = true;
				account = this.create.item(_account, transaction); // this.createAccountImpl requires pw/salt and also redundantly rechecks if the account doesn't exist.
			}
			return account;
		});

		if (dispatchEvent)
			await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccountV3(dbAccount));

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
			MemKey_AccountId.set(uiAccount._id);
			this.logDebug('uiAccount', uiAccount);
			await dispatch_onNewUserRegistered.dispatchModuleAsync(uiAccount);

			//Log in
			const session = await ModuleBE_SessionDB.getOrCreateSession(uiAccount);

			//Update whoever listens
			await dispatch_onUserLogin.dispatchModuleAsync(uiAccount);

			//Finish
			return session;
		},
		login: async (request: Request_LoginAccount, transaction?: Transaction): Promise<Response_Auth> => {
			const {account, session} = await this.loginImpl(request, transaction);
			MemKey_AccountId.set(account._id);
			await dispatch_onUserLogin.dispatchModuleAsync(getUIAccountV3(account));
			return session;
		},
		create: async (request: UI_Account & { password?: string }, transaction?: Transaction) => {
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

			await ModuleBE_SessionDB.delete.query({where: {sessionId}});
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

	private async queryAccountWithPassword(userEmail: string, transaction?: Transaction): Promise<DB_Account> {
		const firestoreQuery = FirestoreInterfaceV3.buildQuery<DBProto_AccountType>(this.collection, {where: {email: userEmail}});
		let results;
		if (transaction)
			results = (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<DB_Account>[];
		else
			results = (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<DB_Account>[];

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

		const session = await ModuleBE_SessionDB.getOrCreateSession(account, transaction);
		return {account, session};
	}

	private createAccountImpl = async (body: Request_CreateAccount, passwordRequired?: boolean, transaction?: Transaction) => {
		//Email always lowerCase
		body.email = body.email.toLowerCase();

		// If login SAML or admin creates an account - it doesn't necessarily receive a password yet.
		let account = {email: body.email, type: body.type} as UI_Account;

		// TODO: this logic seems faulty.. need to re-done
		if (body.password || body.password_check || passwordRequired) {
			this.password.assertPasswordExistence(body.email, body.password, body.password_check);
			this.password.assertPasswordRules(body.password!);

			account = this.spiceAccount(body as Request_RegisterAccount);
			if (!passwordRequired)
				account._newPasswordRequired = true;
		}

		return getUIAccountV3(await this.runTransaction(async _transaction => {
			const existingAccounts = await this.query.custom({where: {email: body.email}}, transaction);
			if (existingAccounts.length > 0)
				throw new ApiException(422, 'User with email already exists');

			return await this.create.item(account as UI_Account, transaction);
		}, transaction));
	};

	private createToken = async ({accountId, ttl}: RequestBody_CreateToken) => {
		const {_id} = await ModuleBE_SessionDB.createSession(accountId, (sessionData) => {
			SessionKey_Session_BE.get(sessionData).expiration = ttl;
			return sessionData;
		});

		return {token: _id};
	};

	changePassword = async (body: RequestBody_ChangePassword, transaction?: Transaction): Promise<Response_Auth> => {
		const lowerCaseEmail = body.userEmail.toLowerCase();
		const updatedAccount = await this.changePasswordImpl(lowerCaseEmail, body.originalPassword, body.newPassword, body.newPassword_check, transaction);
		const newSession = await ModuleBE_SessionDB.createSession(updatedAccount._id);
		return {
			...getUIAccountV3(updatedAccount),
			sessionId: newSession._id
		};
	};

	private changePasswordImpl = async (userEmail: string, originalPassword: string, newPassword: string, newPassword_check: string, transaction?: Transaction) => await this.runTransaction(async (_transaction) => {

		const assertedAccount = await this.password.assertPasswordMatch(originalPassword, userEmail);

		if (!compare(newPassword, newPassword_check))
			throw new ApiException(401, 'Password & password check mismatch');

		const updatedAccount = this.spiceAccount({
			type: 'user',
			email: userEmail,
			password: newPassword,
			password_check: newPassword
		});

		//Update the account with a new password
		return this.set.item({...assertedAccount, ...updatedAccount});
	}, transaction);

	setPassword = async (body: RequestBody_SetPassword, transaction?: Transaction): Promise<Response_Auth> => {
		const updatedAccount = await this.setPasswordImpl(body.userEmail, body.password, body.password_check, transaction);
		const newSession = await ModuleBE_SessionDB.createSession(updatedAccount._id);
		return {
			...getUIAccountV3(updatedAccount),
			sessionId: newSession._id
		};
	};

	private setPasswordImpl = async (userEmail: string, password: string, password_check: string, transaction?: Transaction) => await this.runTransaction(async (_transaction) => {

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

export function getUIAccountV3(account: DB_Account): DB_Account {
	const uiAccount = cloneObj(account);
	delete uiAccount.salt;
	delete uiAccount.saltedPassword;
	return uiAccount as DB_Account;
}

export const ModuleBE_AccountDB = new ModuleBE_AccountDB_Class();