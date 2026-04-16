import {
	ApiException,
	BadImplementationException,
	cloneObj,
	compare,
	dispatch_onApplicationException,
	Dispatcher,
	exists,
	generateHex,
	hashPasswordWithSalt,
	md5,
	Module,
	Year
} from '@nu-art/ts-common';
import {DB_BaseObject} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';
import {FirestoreQuery} from '@nu-art/firebase-shared';

import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {
	_SessionKey_Account,
	AccountEmail,
	AccountEmailWithDevice,
	AccountToAssertPassword,
	AccountToSpice,
	AccountType,
	API_UserAccount,
	ApiDef_UserAccount,
	assertPasswordRules,
	DatabaseDef_Account,
	DB_Account,
	DBDef_Accounts,
	PasswordAssertionConfig,
	PasswordAssertionResponseError,
	SafeDB_Account,
	UI_Account
} from '@nu-art/user-account-shared';

import {Header_Authorization, MemKey_AccountEmail, MemKey_AccountId, MemKey_AccountType, MemKey_DB_Session, SessionKey_Account_BE} from '../session/consts.js';
import {BaseSessionClaims, CollectSessionData, ModuleBE_SessionDB} from '../session/ModuleBE_SessionDB.js';
import {ModuleBE_FailedLoginAttemptDB} from '../failed-login-attempt/ModuleBE_FailedLoginAttemptDB.js';


type BaseAccount = {
	email: string,
	type: AccountType,
}
type SpicedAccount = BaseAccount & {
	salt: string,
	saltedPassword: string
};
type AccountToCreate = SpicedAccount | BaseAccount;

export interface OnNewUserRegistered {
	__onNewUserRegistered(account: SafeDB_Account): void;
}

export interface OnUserLogin {
	__onUserLogin(account: SafeDB_Account): void;
}

export interface OnPreLogout {
	__onPreLogout: () => Promise<void>;
}

export const dispatch_onAccountLogin = new Dispatcher<OnUserLogin, '__onUserLogin'>('__onUserLogin');

const dispatch_onAccountRegistered = new Dispatcher<OnNewUserRegistered, '__onNewUserRegistered'>('__onNewUserRegistered');
export const dispatch_onPreLogout = new Dispatcher<OnPreLogout, '__onPreLogout'>('__onPreLogout');

export interface OnAccountDeleted {
	__onAccountDeleted: (account: SafeDB_Account) => Promise<void>;
}

const dispatch_OnAccountDeleted = new Dispatcher<OnAccountDeleted, '__onAccountDeleted'>('__onAccountDeleted');

type Config = {
	canRegister: boolean
	passwordAssertion?: PasswordAssertionConfig
	ignorePasswordAssertion?: boolean
}

export class ModuleBE_AccountDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Account, Config>
	implements CollectSessionData<_SessionKey_Account> {

	readonly Middleware = async () => {
		const account = SessionKey_Account_BE.get();
		MemKey_AccountEmail.set(account.email!);
		MemKey_AccountId.set(account._id);
		MemKey_AccountType.set(account.type);
	};

	constructor() {
		super(DBDef_Accounts);
	}

	init() {
		super.init();
	}

	@ApiHandler(ApiDef_UserAccount.refreshSession)
	async refreshSession(_params: API_UserAccount['refreshSession']['Params']): Promise<API_UserAccount['refreshSession']['Response']> {
		this.logInfo(`Refreshing session for account id = ${MemKey_AccountId.get()}`);
	}

	@ApiHandler(ApiDef_UserAccount.registerAccount)
	async registerAccount(body: API_UserAccount['registerAccount']['Body']): Promise<API_UserAccount['registerAccount']['Response']> {
		return this.account.register(body);
	}

	@ApiHandler(ApiDef_UserAccount.changePassword)
	async changePassword(body: API_UserAccount['changePassword']['Body']): Promise<API_UserAccount['changePassword']['Response']> {
		return this.account.changePassword(body);
	}

	@ApiHandler(ApiDef_UserAccount.login)
	async login(body: API_UserAccount['login']['Body']): Promise<API_UserAccount['login']['Response']> {
		return this.account.login(body);
	}

	@ApiHandler(ApiDef_UserAccount.createAccount)
	async createAccount(body: API_UserAccount['createAccount']['Body']): Promise<API_UserAccount['createAccount']['Response']> {
		return this.account.create(body);
	}

	@ApiHandler(ApiDef_UserAccount.logout)
	async logout(_params: API_UserAccount['logout']['Params']): Promise<API_UserAccount['logout']['Response']> {
		return this.account.logout();
	}

	@ApiHandler(ApiDef_UserAccount.createToken)
	async createToken(body: API_UserAccount['createToken']['Body']): Promise<API_UserAccount['createToken']['Response']> {
		return this.token.create(body);
	}

	@ApiHandler(ApiDef_UserAccount.setPassword)
	async setPassword(body: API_UserAccount['setPassword']['Body']): Promise<API_UserAccount['setPassword']['Response']> {
		return this.account.setPassword(body);
	}

	@ApiHandler(ApiDef_UserAccount.getSessions)
	async getSessions(params: API_UserAccount['getSessions']['Params']): Promise<API_UserAccount['getSessions']['Response']> {
		return this.account.getSessions(params);
	}

	@ApiHandler(ApiDef_UserAccount.changeThumbnail)
	async changeThumbnail(body: API_UserAccount['changeThumbnail']['Body']): Promise<API_UserAccount['changeThumbnail']['Response']> {
		return this.account.changeThumbnail(body);
	}

	@ApiHandler(ApiDef_UserAccount.getPasswordAssertionConfig)
	async getPasswordAssertionConfig(_params: API_UserAccount['getPasswordAssertionConfig']['Params']): Promise<API_UserAccount['getPasswordAssertionConfig']['Response']> {
		return {
			config: this.config.ignorePasswordAssertion
				? undefined
				: this.config.passwordAssertion
		};
	}

	@ApiHandler(ApiDef_UserAccount.deleteAccount)
	async deleteAccount(params: API_UserAccount['deleteAccount']['Params']): Promise<API_UserAccount['deleteAccount']['Response']> {
		return this.account.delete(params);
	}

	manipulateQuery(query: FirestoreQuery<DB_Account>): FirestoreQuery<DB_Account> {
		return {
			...query,
			select: ['__created', '_v', '__updated', 'email', '_newPasswordRequired', 'type', '_id', 'thumbnail', 'displayName', '_auditorId', 'description']
		};
	}

	// canDeleteItems(dbItems: DB_Account[], transaction?: FirebaseFirestore.Transaction): Promise<void> {
	// 	throw HttpCodes._5XX.NOT_IMPLEMENTED('Account Deletion is not implemented yet');
	// }

	async __collectSessionData(data: BaseSessionClaims) {
		const account = await this.query.uniqueAssert(data.accountId);
		return {
			key: 'account' as const,
			value: {
				...makeAccountSafe(account),
				hasPassword: !!account.saltedPassword,
			},
		};
	}

	protected async preWriteProcessing(dbInstance: UI_Account, originalDbInstance: DatabaseDef_Account['dbType']): Promise<void> {
		try {
			dbInstance._auditorId = MemKey_AccountId.get();
		} catch (e) {
			dbInstance._auditorId = dbInstance._id;
		}
	}

	impl = {
		fixEmail: (objectWithEmail: { email: string }) => {
			objectWithEmail.email = objectWithEmail.email.toLowerCase();
		},
		assertPasswordCheck: (accountToAssert: AccountToAssertPassword) => {
			this.password.assertPasswordExistence(accountToAssert.email, accountToAssert.password, accountToAssert.passwordCheck);
			this.password.assertPasswordRules(accountToAssert.password!);
		},
		spiceAccount: (accountToSpice: AccountToSpice): SpicedAccount => {
			const salt = generateHex(32);
			return {
				email: accountToSpice.email,
				type: 'user',
				salt,
				saltedPassword: hashPasswordWithSalt(salt, accountToSpice.password)
			};
		},
		create: async (accountToCreate: AccountToCreate) => {
			let dbAccount = (await this.query.custom({
				where: {email: accountToCreate.email},
				limit: 1
			}))[0];
			if (dbAccount)
				throw new ApiException(422, `User with email "${accountToCreate.email}" already exists`);

			dbAccount = await this.create.item(accountToCreate);
			return makeAccountSafe(dbAccount);
		},
		setAccountMemKeys: async (account: SafeDB_Account) => {
			MemKey_AccountId.set(account._id);
			MemKey_AccountEmail.set(account.email!);
		},
		onAccountCreated: async (account: SafeDB_Account) => {
			await dispatch_onAccountRegistered.dispatchModuleAsync(account);
		},
		onAccountLogin: async (account: SafeDB_Account) => {
			await dispatch_onAccountLogin.dispatchModuleAsync(account);
		},
		queryUnsafeAccount: async (credentials: AccountEmail) => {
			const results = await this.query.unManipulatedQuery({where: {email: credentials.email}});
			if (results.length === 0) {
				const apiException = new ApiException(401, `There is no account for email '${credentials.email}'.`);
				await dispatch_onApplicationException.dispatchModuleAsync(apiException, this as Module);
				throw apiException;
			}

			if (results.length > 1)
				throw new BadImplementationException(`Too many accounts using this email: '${credentials.email}'`);

			return results[0];
		},
		querySafeAccount: async (credentials: AccountEmail) => {
			const account = await this.impl.queryUnsafeAccount(credentials);
			return makeAccountSafe(account);
		}
	};


	account = {
		// this flow is for creating real human users with email and password
		register: async (accountWithPassword: API_UserAccount['registerAccount']['Body']): Promise<API_UserAccount['registerAccount']['Response']> => {
			if (!this.config.canRegister)
				throw new ApiException(418, 'Registration is disabled!!');

			this.impl.fixEmail(accountWithPassword);
			this.impl.assertPasswordCheck(accountWithPassword);
			const spicedAccount = this.impl.spiceAccount({
				email: accountWithPassword.email,
				password: accountWithPassword.password
			});
			const dbSafeAccount = await this.runTransaction(async () => {
				const dbSafeAccount = await this.impl.create(spicedAccount);
				await this.impl.setAccountMemKeys(dbSafeAccount);
				await this.impl.onAccountCreated(dbSafeAccount);
				return dbSafeAccount;
			});

			await this.account.login({
				email: accountWithPassword.email,
				deviceId: accountWithPassword.deviceId,
				password: accountWithPassword.password
			});
			return {...dbSafeAccount};
		},
		login: async (credentials: API_UserAccount['login']['Body']): Promise<API_UserAccount['login']['Response']> => {
			this.impl.fixEmail(credentials);

			const safeAccount = await this.runTransaction(async () => {
				const dbAccount = await this.impl.queryUnsafeAccount({email: credentials.email});
				await this.password.assertPasswordMatch(dbAccount, credentials.password);
				const safeAccount = makeAccountSafe(dbAccount);
				MemKey_AccountId.set(safeAccount._id);
				await this.impl.onAccountLogin(safeAccount);
				return safeAccount;
			});

			const initialClaims = {
				accountId: safeAccount._id,
				deviceId: credentials.deviceId,
				label: 'password-login'
			};

			await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
			return safeAccount;
		},
		create: async (createAccountRequest: API_UserAccount['createAccount']['Body']): Promise<API_UserAccount['createAccount']['Response']> => {
			const password = createAccountRequest.password;
			let dbSafeAccount: SafeDB_Account;
			this.impl.fixEmail(createAccountRequest);
			return this.runTransaction(async () => {
				if (exists(password) || exists(createAccountRequest.passwordCheck)) {
					this.impl.assertPasswordCheck(createAccountRequest);
					const spicedAccount = this.impl.spiceAccount(createAccountRequest as AccountToSpice);
					dbSafeAccount = await this.impl.create(spicedAccount);
				} else
					dbSafeAccount = await this.impl.create(createAccountRequest);

				await this.impl.onAccountCreated(dbSafeAccount);
				return dbSafeAccount;
			});
		},
		saml: async (oAuthAccount: AccountEmailWithDevice) => {
			this.impl.fixEmail(oAuthAccount);
			const dbSafeAccount = await this.runTransaction(async () => {
				let dbSafeAccount: SafeDB_Account;
				try {
					dbSafeAccount = await this.impl.querySafeAccount({...oAuthAccount});
					this.logInfo('SAML login account');
					MemKey_AccountId.set(dbSafeAccount._id);
					await this.impl.onAccountLogin(dbSafeAccount);
				} catch (e: any) {
					if ((e as ApiException).responseCode !== 401)
						throw e;

					this.logInfo('SAML register account');

					dbSafeAccount = await this.impl.create({email: oAuthAccount.email, type: 'user'});
					MemKey_AccountId.set(dbSafeAccount._id);
					await this.impl.onAccountCreated(dbSafeAccount);
				}
				return dbSafeAccount;
			});
			const initialClaims = {accountId: dbSafeAccount._id, deviceId: oAuthAccount.deviceId, label: 'saml-login'};
			return ModuleBE_SessionDB._session.create({initialClaims});
		},
		changePassword: async (passwordToChange: API_UserAccount['changePassword']['Body']): Promise<API_UserAccount['changePassword']['Response']> => {
			return this.runTransaction(async () => {
				const email = MemKey_AccountEmail.get();
				const deviceId = MemKey_DB_Session.get().deviceId;
				await this.account.login({email, deviceId, password: passwordToChange.oldPassword}); // perform login to make sure the old password holds

				if (!compare(passwordToChange.password, passwordToChange.passwordCheck))
					throw HttpCodes._4XX.UNAUTHORIZED('Password check mismatch');

				const safeAccount = await this.impl.querySafeAccount({email});

				this.impl.assertPasswordCheck({
					email,
					password: passwordToChange.password,
					passwordCheck: passwordToChange.passwordCheck
				});
				const spicedAccount = this.impl.spiceAccount({email, password: passwordToChange.password});
				const updatedAccount = await this.set.item({
					...safeAccount,
					salt: spicedAccount.salt,
					saltedPassword: spicedAccount.saltedPassword
				});

				const initialClaims = {
					accountId: updatedAccount._id,
					deviceId,
					label: 'password-change'
				};

				await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
				return makeAccountSafe(updatedAccount);
			});
		},
		setPassword: async (passwordBody: API_UserAccount['setPassword']['Body']): Promise<API_UserAccount['setPassword']['Response']> => {
			return this.runTransaction(async () => {
				const email = MemKey_AccountEmail.get();
				const deviceId = MemKey_DB_Session.get().deviceId;

				const dbAccount = await this.impl.queryUnsafeAccount({email});
				if (dbAccount.saltedPassword)
					throw HttpCodes._4XX.FORBIDDEN('account already has password');

				const safeAccount = makeAccountSafe(dbAccount);

				this.impl.assertPasswordCheck({email, ...passwordBody});
				const spicedAccount = this.impl.spiceAccount({email, password: passwordBody.password});
				const updatedAccount = await this.set.item({
					...safeAccount,
					salt: spicedAccount.salt,
					saltedPassword: spicedAccount.saltedPassword
				});

				const initialClaims = {
					accountId: updatedAccount._id,
					deviceId,
					label: 'password-set'
				};

				await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
				return makeAccountSafe(updatedAccount);
			});
		},
		logout: async () => {
			const sessionId = Header_Authorization.get();
			if (!sessionId)
				throw HttpCodes._4XX.FORBIDDEN('Missing sessionId');

			await dispatch_onPreLogout.dispatchModuleAsync();
			await ModuleBE_SessionDB._session.invalidate.bySession();
		},
		getSessions: async (query: DB_BaseObject<DatabaseDef_Account['dbKey']>) => {
			return {sessions: await ModuleBE_SessionDB.query.where({accountId: query._id})};
		},
		changeThumbnail: async (request: API_UserAccount['changeThumbnail']['Body']): Promise<API_UserAccount['changeThumbnail']['Response']> => {
			const account = this.doc.unique(request.accountId);
			if (!account)
				throw HttpCodes._4XX.NOT_FOUND('Could not change account thumbnail', `Could not find account with id ${request.accountId}`);

			await account.ref.update({thumbnail: request.hash});
			return {
				account: (await account.get())!,
			};
		},
		delete: async (request: API_UserAccount['deleteAccount']['Params']): Promise<API_UserAccount['deleteAccount']['Response']> => {
			return await this.runTransaction(async () => {
				const account = await this.query.unique(request.accountId);
				if (!account)
					throw HttpCodes._4XX.NOT_FOUND(`Account with id ${request.accountId} Not Found!`);

				try {
					const safeAccount = makeAccountSafe(account);
					await dispatch_OnAccountDeleted.dispatchModuleAsyncSerial(safeAccount);
					await this.delete.item(account);
					return {account};
				} catch (err: any) {
					const error = err as ApiException;
					if (error.responseCode === 422)
						throw error;

					this.logError('Failed deleting account', err);
					throw HttpCodes._5XX.INTERNAL_SERVER_ERROR('Failed to delete account', error.message, error);
				}
			});
		}
	};

	password = {
		assertPasswordExistence: (email: string, password?: string, passwordCheck?: string) => {
			if (!password || !passwordCheck)
				throw HttpCodes._4XX.BAD_REQUEST(`Did not receive a password`, `Did not receive a password for email ${email}.`);

			if (password !== passwordCheck)
				throw HttpCodes._4XX.BAD_REQUEST(`Password check does not match`, `Password does not match password check for email ${email}.`);
		},
		assertPasswordRules: (password: string) => {
			const assertPassword = assertPasswordRules(password, this.config.passwordAssertion);
			if (assertPassword)
				throw new ApiException<PasswordAssertionResponseError>(444, `Password assertion failed`).setErrorBody({
					type: 'password-assertion-error',
					data: assertPassword,
				});
		},
		assertPasswordMatch: async (safeAccount: SafeDB_Account, password: string) => {
			if (!safeAccount.salt || !safeAccount.saltedPassword)
				throw new ApiException(401, 'Account was never logged in using username and password, probably logged using SAML');

			if (hashPasswordWithSalt(safeAccount.salt, password) !== safeAccount.saltedPassword) {
				await ModuleBE_FailedLoginAttemptDB.updateFailedLoginAttempt(safeAccount._id); // first update login attempt
				throw new ApiException(401, 'Wrong username or password.');
			}
		}
	};

	// @ts-ignore
	private token = {
		create: async ({accountId, ttl, label}: API_UserAccount['createToken']['Body']): Promise<API_UserAccount['createToken']['Response']> => {
			if (!exists(ttl) || ttl < Year)
				throw HttpCodes._4XX.BAD_REQUEST('Invalid token TTL', `TTL value is invalid (${ttl})`);

			const account = await this.query.unique(accountId);

			if (!account)
				throw new BadImplementationException(`Account not found for id ${accountId}`);

			if (account.type !== 'service')
				throw new BadImplementationException('Can not generate a token for a non service account');

			const initialClaims = {accountId, deviceId: accountId, label};
			const dbSession = await ModuleBE_SessionDB._session.create({initialClaims}, ttl);
			// sessionId here is the JWT that is created and placed inside DB_Session.sessionIdJWT
			return {token: dbSession.sessionIdJwt};
		},
		invalidate: async (token: string) => await ModuleBE_SessionDB.delete.where({_id: md5(token)}),
		invalidateAll: async (accountId: string) => await ModuleBE_SessionDB.delete.where({accountId})
	};
}

export function makeAccountSafe(account: DB_Account): SafeDB_Account {
	const uiAccount = cloneObj(account);
	delete uiAccount.salt;
	delete uiAccount.saltedPassword;
	return uiAccount as DB_Account;
}

export const ModuleBE_AccountDB = new ModuleBE_AccountDB_Class();
