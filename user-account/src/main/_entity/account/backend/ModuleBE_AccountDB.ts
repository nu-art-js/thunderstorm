import {
	ApiException,
	BadImplementationException,
	cloneObj,
	compare,
	currentTimeMillis,
	DB_BaseObject,
	dispatch_onApplicationException,
	Dispatcher,
	exists,
	generateHex,
	hashPasswordWithSalt,
	md5,
	MUSTNeverHappenException,
	Year
} from '@nu-art/ts-common';
import {firestore} from 'firebase-admin';
import {addRoutes, createBodyServerApi, createQueryServerApi, ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {FirestoreInterfaceV3} from '@nu-art/firebase/backend/firestore-v3/FirestoreInterfaceV3';
import {FirestoreType_DocumentSnapshot} from '@nu-art/firebase/backend';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';
import {
	_SessionKey_Account,
	Account_ChangePassword,
	Account_ChangeThumbnail,
	Account_CreateAccount,
	Account_CreateToken,
	Account_Login,
	Account_RegisterAccount,
	Account_SetPassword,
	AccountEmail,
	AccountEmailWithDevice,
	AccountToAssertPassword,
	AccountToSpice,
	AccountType,
	ApiDef_Account,
	DB_Account,
	DBDef_Accounts,
	DBProto_Account,
	SafeDB_Account,
	UI_Account
} from '../shared';
import {assertPasswordRules, PasswordAssertionConfig, PasswordAssertionResponseError} from '../../_enum';
import {
	CollectSessionData,
	Header_SessionId,
	MemKey_AccountEmail,
	MemKey_AccountId,
	ModuleBE_SessionDB,
	SessionCollectionParam,
	SessionKey_Account_BE,
	SessionKey_Session_BE
} from '../../session/backend';
import {HeaderKey_SessionId} from '@nu-art/thunderstorm/shared/headers';
import Transaction = firestore.Transaction;


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
	__onNewUserRegistered(account: SafeDB_Account, transaction: Transaction): void;
}

export interface OnUserLogin {
	__onUserLogin(account: SafeDB_Account, transaction: Transaction): void;
}

export interface OnPreLogout {
	__onPreLogout: () => Promise<void>;
}

export const dispatch_onAccountLogin = new Dispatcher<OnUserLogin, '__onUserLogin'>('__onUserLogin');

const dispatch_onAccountRegistered = new Dispatcher<OnNewUserRegistered, '__onNewUserRegistered'>('__onNewUserRegistered');
export const dispatch_onPreLogout = new Dispatcher<OnPreLogout, '__onPreLogout'>('__onPreLogout');

type Config = {
	canRegister: boolean
	passwordAssertion?: PasswordAssertionConfig
}

export class ModuleBE_AccountDB_Class
	extends ModuleBE_BaseDB<DBProto_Account, Config>
	implements CollectSessionData<_SessionKey_Account> {

	readonly Middleware = async () => {
		const account = SessionKey_Account_BE.get();
		MemKey_AccountEmail.set(account.email!);
		MemKey_AccountId.set(account._id);
	};

	constructor() {
		super(DBDef_Accounts);
	}

	init() {
		super.init();

		addRoutes([
			createQueryServerApi(ApiDef_Account._v1.refreshSession, async () => {
				await ModuleBE_SessionDB.session.rotate();
			}),
			createBodyServerApi(ApiDef_Account._v1.registerAccount, this.account.register),
			createBodyServerApi(ApiDef_Account._v1.changePassword, this.account.changePassword),
			createBodyServerApi(ApiDef_Account._v1.login, this.account.login),
			createBodyServerApi(ApiDef_Account._v1.createAccount, this.account.create),
			createQueryServerApi(ApiDef_Account._v1.logout, this.account.logout),
			createBodyServerApi(ApiDef_Account._v1.createToken, this.token.create),
			createBodyServerApi(ApiDef_Account._v1.setPassword, this.account.setPassword),
			createQueryServerApi(ApiDef_Account._v1.getSessions, this.account.getSessions),
			createBodyServerApi(ApiDef_Account._v1.changeThumbnail, this.account.changeThumbnail),
			createQueryServerApi(ApiDef_Account._v1.getPasswordAssertionConfig, async () => ({config: this.config.passwordAssertion}))
		]);
	}

	manipulateQuery(query: FirestoreQuery<DB_Account>): FirestoreQuery<DB_Account> {
		return {
			...query,
			select: ['__created', '_v', '__updated', 'email', '_newPasswordRequired', 'type', '_id', 'thumbnail', 'displayName', '_auditorId']
		};
	}

	canDeleteItems(dbItems: DB_Account[], transaction?: FirebaseFirestore.Transaction): Promise<void> {
		throw HttpCodes._5XX.NOT_IMPLEMENTED('Account Deletion is not implemented yet');
	}

	async __collectSessionData(data: SessionCollectionParam) {
		const account = await this.query.uniqueAssert(data.accountId);
		return {
			key: 'account' as const,
			value: {
				...makeAccountSafe(account),
				hasPassword: !!account.saltedPassword,
			},
		};
	}

	protected async preWriteProcessing(dbInstance: UI_Account, transaction?: Transaction): Promise<void> {
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
		create: async (accountToCreate: AccountToCreate, transaction: Transaction) => {
			let dbAccount = (await this.query.custom({
				where: {email: accountToCreate.email},
				limit: 1
			}, transaction))[0];
			if (dbAccount)
				throw new ApiException(422, `User with email "${accountToCreate.email}" already exists`);

			dbAccount = await this.create.item(accountToCreate, transaction);
			return makeAccountSafe(dbAccount);
		},
		setAccountMemKeys: async (account: SafeDB_Account) => {
			MemKey_AccountId.set(account._id);
			MemKey_AccountEmail.set(account.email!);
		},
		onAccountCreated: async (account: SafeDB_Account, transaction: Transaction) => {
			await dispatch_onAccountRegistered.dispatchModuleAsync(account, transaction);
		},
		onAccountLogin: async (account: SafeDB_Account, transaction: Transaction) => {
			await dispatch_onAccountLogin.dispatchModuleAsync(account, transaction);
		},
		queryUnsafeAccount: async (credentials: AccountEmail, transaction?: Transaction) => {
			const firestoreQuery = FirestoreInterfaceV3.buildQuery<DBProto_Account>(this.collection, {where: {email: credentials.email}});
			let results;
			if (transaction)
				results = (await transaction.get(firestoreQuery)).docs as FirestoreType_DocumentSnapshot<DB_Account>[];
			else
				results = (await firestoreQuery.get()).docs as FirestoreType_DocumentSnapshot<DB_Account>[];

			if (results.length !== 1)
				if (results.length === 0) {
					const apiException = new ApiException(401, `There is no account for email '${credentials.email}'.`);
					await dispatch_onApplicationException.dispatchModuleAsync(apiException, this);
					throw apiException;
				} else if (results.length > 1) {
					this.logWarningBold(`Too many accounts using this email! '${credentials.email}'`);
					throw new MUSTNeverHappenException('Too many accounts using this email');
				}

			return results[0].data();
		},
		querySafeAccount: async (credentials: AccountEmail, transaction?: Transaction) => {
			const account = await this.impl.queryUnsafeAccount(credentials, transaction);
			return makeAccountSafe(account);
		}
	};

	account = {
		// this flow is for creating real human users with email and password
		register: async (accountWithPassword: Account_RegisterAccount['request'], transaction?: Transaction): Promise<Account_RegisterAccount['response']> => {
			if (!this.config.canRegister)
				throw new ApiException(418, 'Registration is disabled!!');

			this.impl.fixEmail(accountWithPassword);
			this.impl.assertPasswordCheck(accountWithPassword);
			const spicedAccount = this.impl.spiceAccount(accountWithPassword);
			const dbSafeAccount = await this.runTransaction(async transaction => {
				const dbSafeAccount = await this.impl.create(spicedAccount, transaction);
				await this.impl.setAccountMemKeys(dbSafeAccount);
				await this.impl.onAccountCreated(dbSafeAccount, transaction);
				return dbSafeAccount;
			});

			await this.account.login({
				email: accountWithPassword.email,
				deviceId: accountWithPassword.deviceId,
				password: accountWithPassword.password
			});
			return {...dbSafeAccount};
		},
		login: async (credentials: Account_Login['request']): Promise<Account_Login['response']> => {
			this.impl.fixEmail(credentials);

			const safeAccount = await this.runTransaction(async transaction => {
				const dbAccount = await this.impl.queryUnsafeAccount({email: credentials.email}, transaction);
				await this.password.assertPasswordMatch(dbAccount, credentials.password);
				const safeAccount = makeAccountSafe(dbAccount);
				MemKey_AccountId.set(safeAccount._id);
				await this.impl.onAccountLogin(safeAccount, transaction);
				return safeAccount;
			});

			const content = {
				accountId: safeAccount._id,
				deviceId: credentials.deviceId,
				label: 'password-login'
			};
			const session = await ModuleBE_SessionDB.session.create(content);
			MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, session.sessionId);
			return safeAccount;
		},
		create: async (createAccountRequest: Account_CreateAccount['request']): Promise<Account_CreateAccount['response']> => {
			const password = createAccountRequest.password;
			let dbSafeAccount: SafeDB_Account;
			this.impl.fixEmail(createAccountRequest);
			return this.runTransaction(async transaction => {
				if (exists(password) || exists(createAccountRequest.passwordCheck)) {
					this.impl.assertPasswordCheck(createAccountRequest);
					const spicedAccount = this.impl.spiceAccount(createAccountRequest as AccountToSpice);
					dbSafeAccount = await this.impl.create(spicedAccount, transaction);
				} else
					dbSafeAccount = await this.impl.create(createAccountRequest, transaction);

				await this.impl.onAccountCreated(dbSafeAccount, transaction);
				return dbSafeAccount;
			});
		},
		saml: async (oAuthAccount: AccountEmailWithDevice) => {
			this.impl.fixEmail(oAuthAccount);
			const dbSafeAccount = await this.runTransaction(async transaction => {
				let dbSafeAccount: SafeDB_Account;
				try {
					dbSafeAccount = await this.impl.querySafeAccount({...oAuthAccount}, transaction);
					this.logInfo('SAML login account');
					MemKey_AccountId.set(dbSafeAccount._id);
					await this.impl.onAccountLogin(dbSafeAccount, transaction);
				} catch (e: any) {
					if ((e as ApiException).responseCode !== 401)
						throw e;

					this.logInfo('SAML register account');

					dbSafeAccount = await this.impl.create({email: oAuthAccount.email, type: 'user'}, transaction);
					MemKey_AccountId.set(dbSafeAccount._id);
					await this.impl.onAccountCreated(dbSafeAccount, transaction);
				}
				return dbSafeAccount;
			});
			const content = {accountId: dbSafeAccount._id, deviceId: oAuthAccount.deviceId, label: 'saml-login'};
			return ModuleBE_SessionDB.session.create(content);
		},
		changePassword: async (passwordToChange: Account_ChangePassword['request']): Promise<Account_ChangePassword['response']> => {
			return this.runTransaction(async transaction => {
				const email = MemKey_AccountEmail.get();
				const deviceId = SessionKey_Session_BE.get().deviceId;
				await this.account.login({email, deviceId, password: passwordToChange.oldPassword}); // perform login to make sure the old password holds

				if (!compare(passwordToChange.password, passwordToChange.passwordCheck))
					throw new ApiException(401, 'Password check mismatch');

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
				}, transaction);

				const content = {
					accountId: updatedAccount._id,
					deviceId,
					label: 'password-change'
				};
				const newSession = await ModuleBE_SessionDB.session.create(content);
				MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, newSession.sessionId);

				return makeAccountSafe(updatedAccount);
			});
		},
		setPassword: async (passwordBody: Account_SetPassword['request']): Promise<Account_SetPassword['response']> => {
			return this.runTransaction(async transaction => {
				const email = MemKey_AccountEmail.get();
				const deviceId = SessionKey_Session_BE.get().deviceId;

				const dbAccount = await this.impl.queryUnsafeAccount({email}, transaction);
				if (dbAccount.saltedPassword)
					throw new ApiException(403, 'account already has password');

				const safeAccount = makeAccountSafe(dbAccount);

				this.impl.assertPasswordCheck({email, ...passwordBody});
				const spicedAccount = this.impl.spiceAccount({email, password: passwordBody.password});
				const updatedAccount = await this.set.item({
					...safeAccount,
					salt: spicedAccount.salt,
					saltedPassword: spicedAccount.saltedPassword
				}, transaction);

				const content = {
					accountId: updatedAccount._id,
					deviceId,
					label: 'password-set'
				};
				const newSession = await ModuleBE_SessionDB.session.create(content);
				MemKey_HttpResponse.get().setHeader(HeaderKey_SessionId, newSession.sessionId);

				return makeAccountSafe(updatedAccount);
			});
		},
		logout: async () => {
			const sessionId = Header_SessionId.get();
			if (!sessionId)
				throw new ApiException(404, 'Missing sessionId');

			await dispatch_onPreLogout.dispatchModuleAsync();
			await ModuleBE_SessionDB.delete.query({where: {sessionId: md5(sessionId)}});
		},
		getSessions: async (query: DB_BaseObject) => {
			return {sessions: await ModuleBE_SessionDB.query.where({accountId: query._id})};
		},
		changeThumbnail: async (request: Account_ChangeThumbnail['request']): Promise<Account_ChangeThumbnail['response']> => {
			const account = await this.doc.unique(request.accountId);
			if (!account)
				throw HttpCodes._4XX.NOT_FOUND('Could not change account thumbnail', `Could not find account with id ${request.accountId}`);

			await account.ref.update({thumbnail: request.hash});
			return {
				account: (await account.get())!,
			};
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

			if (hashPasswordWithSalt(safeAccount.salt, password) !== safeAccount.saltedPassword)
				throw new ApiException(401, 'Wrong username or password.');
		}
	};

	// @ts-ignore
	private token = {
		create: async ({
						   accountId,
						   ttl,
						   label
					   }: Account_CreateToken['request']): Promise<Account_CreateToken['response']> => {
			if (!exists(ttl) || ttl < Year)
				throw HttpCodes._4XX.BAD_REQUEST('Invalid token TTL', `TTL value is invalid (${ttl})`);

			const account = await this.query.unique(accountId);

			if (!account)
				throw new BadImplementationException(`Account not found for id ${accountId}`);

			if (account.type !== 'service')
				throw new BadImplementationException('Can not generate a token for a non service account');

			const content = {accountId, deviceId: accountId, label};
			const {sessionId} = await ModuleBE_SessionDB.session.createCustom(content, (sessionData) => {
				SessionKey_Session_BE.get(sessionData).expiration = currentTimeMillis() + ttl;
				return sessionData;
			});

			return {token: sessionId};
		},
		invalidate: async (token: string) => await ModuleBE_SessionDB.delete.where({sessionId: token}),
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
