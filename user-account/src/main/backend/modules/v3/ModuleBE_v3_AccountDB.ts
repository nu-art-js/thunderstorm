import {ModuleBE_BaseDBV3} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV3';
import {
	_SessionKey_Account,
	_SessionKey_AccountV3,
	ApiDefBE_AccountV3,
	DB_AccountV3,
	DBProto_AccountType,
	Request_CreateAccountV3,
	Request_LoginAccount,
	Request_RegisterAccount,
	RequestBody_ChangePassword,
	RequestBody_CreateToken,
	RequestBody_RegisterAccount,
	RequestBody_SetPassword,
	Response_Auth_V3,
	UI_AccountV3
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
	MUSTNeverHappenException
} from '@nu-art/ts-common';
import {DBApiConfigV3} from '@nu-art/db-api-generator/backend';
import {
	CollectSessionDataV3,
	Header_SessionIdV3,
	MemKey_AccountEmailV3,
	MemKey_AccountIdV3,
	ModuleBE_v3_SessionDB,
	SessionKey_Session_BE_V3,
} from './ModuleBE_v3_SessionDB';
import {assertPasswordRules, PasswordAssertionConfig} from '../../../shared/assertion';
import {firestore} from 'firebase-admin';
import {QueryParams} from '@nu-art/thunderstorm';
import {addRoutes, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {FirestoreInterfaceV3} from '@nu-art/firebase/backend/firestore-v3/FirestoreInterfaceV3';
import {FirestoreType_DocumentSnapshot} from '@nu-art/firebase/backend';
import {DBDef_v3_Accounts} from '../../../shared/v3-db-def';
import {SessionKey_BE} from '../v2';
import Transaction = firestore.Transaction;


export interface OnNewUserRegisteredV3 {
	__onNewUserRegistered(account: DB_AccountV3): void;
}

export interface OnUserLoginV3 {
	__onUserLogin(account: DB_AccountV3): void;
}

export const dispatch_onUserLoginV3 = new Dispatcher<OnUserLoginV3, '__onUserLogin'>('__onUserLogin');

const dispatch_onNewUserRegisteredV3 = new Dispatcher<OnNewUserRegisteredV3, '__onNewUserRegistered'>('__onNewUserRegistered');

type Config = DBApiConfigV3<DBProto_AccountType> & {
	canRegister: boolean
	passwordAssertion?: PasswordAssertionConfig
}


export const SessionKey_Account_BE_V3 = new SessionKey_BE<_SessionKey_Account>('account');

export class ModuleBE_v3_AccountDB_Class
	extends ModuleBE_BaseDBV3<DBProto_AccountType, Config>
	implements CollectSessionDataV3<_SessionKey_AccountV3> {

	readonly Middleware = async () => {
		const account = SessionKey_Account_BE_V3.get();
		MemKey_AccountEmailV3.set(account.email);
		MemKey_AccountIdV3.set(account._id);
	};

	constructor() {
		super(DBDef_v3_Accounts);
	}

	manipulateQuery(query: FirestoreQuery<DB_AccountV3>): FirestoreQuery<DB_AccountV3> {
		return {...query, select: ['email', '_newPasswordRequired', 'type', '_id', 'thumbnail', 'displayName', '_auditorId']};
	}

	canDeleteItems(dbItems: DB_AccountV3[], transaction?: FirebaseFirestore.Transaction): Promise<void> {
		throw new DontCallthisException('Cannot delete accounts yet');
	}

	async __collectSessionData(accountId: string) {
		const account = await this.query.uniqueAssert(accountId);
		return {
			key: 'account' as const,
			value: {
				...account as DB_AccountV3,
				hasPassword: !!account.saltedPassword,
			},
		};
	}

	init() {
		super.init();

		addRoutes([
			createBodyServerApi(ApiDefBE_AccountV3.vv1.registerAccount, this.account.register),
			createBodyServerApi(ApiDefBE_AccountV3.vv1.changePassword, this.changePassword),
			createBodyServerApi(ApiDefBE_AccountV3.vv1.login, this.account.login),
			createBodyServerApi(ApiDefBE_AccountV3.vv1.createAccount, this.account.create),
			createQueryServerApi(ApiDefBE_AccountV3.vv1.logout, this.account.logout),
			createBodyServerApi(ApiDefBE_AccountV3.vv1.createToken, this.createToken),
			createBodyServerApi(ApiDefBE_AccountV3.vv1.setPassword, this.setPassword)
		]);
	}

	protected async preWriteProcessing(dbInstance: UI_AccountV3, transaction?: Transaction): Promise<void> {
		dbInstance._auditorId = MemKey_AccountEmailV3.get();
	}

	private spiceAccount(request: Request_RegisterAccount): UI_AccountV3 {
		const email = request.email.toLowerCase(); //Email always lowerCase
		const salt = generateHex(32);
		return {
			email: email,
			type: request.type,
			salt,
			saltedPassword: hashPasswordWithSalt(salt, request.password)
		} as UI_AccountV3;
	}

	/**
	 * Create an account without passing through this.spiceAccount - as in without password/salt,
	 * for loginSaml initial login
	 */
	getOrCreate = async (query: { where: { email: string } }): Promise<DB_AccountV3> => {
		let dispatchEvent = false;

		const dbAccount = await this.runTransaction(async (transaction: Transaction) => {
			let account;
			try {
				account = await this.query.uniqueCustom(query, transaction);
			} catch (err) {
				const _account: UI_AccountV3 = {
					email: query.where.email,
					type: 'user'
				} as UI_AccountV3;

				dispatchEvent = true;
				account = this.create.item(_account, transaction); // this.createAccountImpl requires pw/salt and also redundantly rechecks if the account doesn't exist.
			}
			return account;
		});

		if (dispatchEvent)
			await dispatch_onNewUserRegisteredV3.dispatchModuleAsync(getUIAccountV3(dbAccount));

		return dbAccount;
	};

	account = {
		register: async (body: RequestBody_RegisterAccount, transaction?: Transaction): Promise<Response_Auth_V3> => {
			if (!this.config.canRegister)
				throw new ApiException(418, 'Registration is disabled!!');

			// this flow is for user accounts
			(body as Request_RegisterAccount).type = 'user';

			this.password.assertPasswordRules(body.password);

			//Email always lowerCase
			body.email = body.email.toLowerCase();
			MemKey_AccountEmailV3.set(body.email); // set here, because MemKey_AccountEmail is needed in createAccountImpl

			//Create the account
			const uiAccount = await this.createAccountImpl(body as Request_RegisterAccount, true, transaction); // Must have a password, because we use it to auto-login immediately after
			this.logErrorBold('uiAccount', uiAccount);
			await dispatch_onNewUserRegisteredV3.dispatchModuleAsync(uiAccount);

			//Log in
			const session = await ModuleBE_v3_SessionDB.getOrCreateSession(uiAccount);

			//Update whoever listens
			await dispatch_onUserLoginV3.dispatchModuleAsync(uiAccount);

			//Finish
			return session;
		},
		login: async (request: Request_LoginAccount, transaction?: Transaction): Promise<Response_Auth_V3> => {
			const {account, session} = await this.loginImpl(request, transaction);

			await dispatch_onUserLoginV3.dispatchModuleAsync(getUIAccountV3(account));
			return session;
		},
		create: async (request: UI_AccountV3 & { password?: string }, transaction?: Transaction) => {
			if (request.type === 'user') {
				if (request.password) {
					const uiAccount = await this.createAccountImpl(request, true, transaction);
					await dispatch_onNewUserRegisteredV3.dispatchModuleAsync(uiAccount);
					return uiAccount;
				}

				throw new BadImplementationException('Trying to create a user from type user without password provided');
			}

			const uiAccount = await this.createAccountImpl(request, false, transaction);
			await dispatch_onNewUserRegisteredV3.dispatchModuleAsync(uiAccount);
			return uiAccount;
		},
		logout: async (queryParams: QueryParams) => {
			const sessionId = Header_SessionIdV3.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await ModuleBE_v3_SessionDB.delete.query({where: {sessionId}});
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

	private async queryAccountWithPassword(userEmail: string, transaction?: Transaction): Promise<DB_AccountV3> {
		const firestoreQuery = FirestoreInterfaceV3.buildQuery<DBProto_AccountType>(this.collection, {where: {email: userEmail}});
		let results;
		if (transaction)
			results = (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<DB_AccountV3>[];
		else
			results = (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<DB_AccountV3>[];

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

		const session = await ModuleBE_v3_SessionDB.getOrCreateSession(account, transaction);
		return {account, session};
	}

	private createAccountImpl = async (body: Request_CreateAccountV3, passwordRequired?: boolean, transaction?: Transaction) => {
		//Email always lowerCase
		body.email = body.email.toLowerCase();

		// If login SAML or admin creates an account - it doesn't necessarily receive a password yet.
		let account = {email: body.email, type: body.type} as UI_AccountV3;

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

			return await this.create.item(account as UI_AccountV3, transaction);
		}, transaction));
	};

	private createToken = async ({accountId, ttl}: RequestBody_CreateToken) => {
		const {_id} = await ModuleBE_v3_SessionDB.createSession(accountId, (sessionData) => {
			SessionKey_Session_BE_V3.get(sessionData).expiration = ttl;
			return sessionData;
		});


		return {token: _id};
	};

	changePassword = async (body: RequestBody_ChangePassword, transaction?: Transaction): Promise<Response_Auth_V3> => {
		const lowerCaseEmail = body.userEmail.toLowerCase();
		const updatedAccount = await this.changePasswordImpl(lowerCaseEmail, body.originalPassword, body.newPassword, body.newPassword_check, transaction);
		const newSession = await ModuleBE_v3_SessionDB.createSession(updatedAccount._id);
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

	setPassword = async (body: RequestBody_SetPassword, transaction?: Transaction): Promise<Response_Auth_V3> => {
		const updatedAccount = await this.setPasswordImpl(body.userEmail, body.password, body.password_check, transaction);
		const newSession = await ModuleBE_v3_SessionDB.createSession(updatedAccount._id);
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

export function getUIAccountV3(account: DB_AccountV3): DB_AccountV3 {
	const uiAccount = cloneObj(account);
	delete uiAccount.salt;
	delete uiAccount.saltedPassword;
	return uiAccount as DB_AccountV3;
}

export const ModuleBE_v3_AccountDB = new ModuleBE_v3_AccountDB_Class();