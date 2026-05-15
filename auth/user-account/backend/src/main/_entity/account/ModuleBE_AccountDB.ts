import {
	ApiException,
	BadImplementationException,
	dispatch_onApplicationException,
	Dispatcher,
	exists,
	Module,
	Year
} from '@nu-art/ts-common';
import {DB_BaseObject} from '@nu-art/db-api-shared';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {ApiHandler} from '@nu-art/http-server';

import {HttpCodes} from '@nu-art/api-types';
import {md5} from '@nu-art/ts-common';
import {
	_SessionKey_Account,
	AccountEmail,
	API_UserAccount,
	ApiDef_UserAccount,
	DatabaseDef_Account,
	DB_Account,
	DBDef_Accounts,
	isServiceEmail,
	mangleServiceEmail,
	UI_Account
} from '@nu-art/user-account-shared';

import {Header_Authorization, MemKey_AccountEmail, MemKey_AccountId, MemKey_AccountType, SessionKey_Account_BE} from '../session/consts.js';
import {BaseSessionClaims, CollectSessionData, ModuleBE_SessionDB} from '../session/ModuleBE_SessionDB.js';


export interface OnNewUserRegistered {
	__onNewUserRegistered(account: DB_Account): void;
}

export interface OnUserLogin {
	__onUserLogin(account: DB_Account): void;
}

export interface OnPreLogout {
	__onPreLogout: () => Promise<void>;
}

export const dispatch_onAccountLogin = new Dispatcher<OnUserLogin, '__onUserLogin'>('__onUserLogin');

const dispatch_onAccountRegistered = new Dispatcher<OnNewUserRegistered, '__onNewUserRegistered'>('__onNewUserRegistered');
export const dispatch_onPreLogout = new Dispatcher<OnPreLogout, '__onPreLogout'>('__onPreLogout');

export interface OnAccountDeleted {
	__onAccountDeleted: (account: DB_Account) => Promise<void>;
}

const dispatch_OnAccountDeleted = new Dispatcher<OnAccountDeleted, '__onAccountDeleted'>('__onAccountDeleted');

export class ModuleBE_AccountDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_Account>
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

	@ApiHandler(ApiDef_UserAccount.getSessions)
	async getSessions(params: API_UserAccount['getSessions']['Params']): Promise<API_UserAccount['getSessions']['Response']> {
		return this.account.getSessions(params);
	}

	@ApiHandler(ApiDef_UserAccount.changeThumbnail)
	async changeThumbnail(body: API_UserAccount['changeThumbnail']['Body']): Promise<API_UserAccount['changeThumbnail']['Response']> {
		return this.account.changeThumbnail(body);
	}

	@ApiHandler(ApiDef_UserAccount.deleteAccount)
	async deleteAccount(params: API_UserAccount['deleteAccount']['Params']): Promise<API_UserAccount['deleteAccount']['Response']> {
		return this.account.delete(params);
	}

	async __collectSessionData(data: BaseSessionClaims) {
		const account = await this.query.uniqueAssert(data.accountId);
		return {
			key: 'account' as const,
			value: account,
		};
	}

	protected async preWriteProcessing(dbInstance: UI_Account, originalDbInstance: DatabaseDef_Account['dbType']): Promise<void> {
		try {
			dbInstance._auditorId = MemKey_AccountId.get();
		} catch (e) {
			dbInstance._auditorId = dbInstance._id;
		}

		if (dbInstance.type === 'service' && !isServiceEmail(dbInstance.email))
			dbInstance.email = mangleServiceEmail(dbInstance.email);
	}

	impl = {
		fixEmail: (objectWithEmail: { email: string }) => {
			objectWithEmail.email = objectWithEmail.email.toLowerCase();
		},
		create: async (accountToCreate: { email: string, type: string }) => {
			let dbAccount = (await this.query.custom({
				where: {email: accountToCreate.email},
				limit: 1
			}))[0];
			if (dbAccount)
				throw HttpCodes._4XX.UNPROCESSABLE_ENTITY(`User with email "${accountToCreate.email}" already exists`);

			return this.create.item(accountToCreate);
		},
		setAccountMemKeys: async (account: DB_Account) => {
			MemKey_AccountId.set(account._id);
			MemKey_AccountEmail.set(account.email!);
		},
		onAccountCreated: async (account: DB_Account) => {
			this.logDebug(`onAccountCreated: dispatching for _id='${account._id}' email='${account.email}'`);
			await dispatch_onAccountRegistered.dispatchModuleAsync(account);
			this.logDebug(`onAccountCreated: dispatch complete`);
		},
		onAccountLogin: async (account: DB_Account) => {
			this.logDebug(`onAccountLogin: dispatching for _id='${account._id}' email='${account.email}'`);
			await dispatch_onAccountLogin.dispatchModuleAsync(account);
			this.logDebug(`onAccountLogin: dispatch complete`);
		},
		queryAccountByEmail: async (credentials: AccountEmail): Promise<DB_Account> => {
			this.logDebug(`queryAccountByEmail: looking up email='${credentials.email}'`);
			const results = await this.query.custom({where: {email: credentials.email}, limit: 2});
			this.logDebug(`queryAccountByEmail: found ${results.length} result(s) for email='${credentials.email}'`);
			if (results.length === 0) {
				const apiException = HttpCodes._4XX.UNAUTHORIZED(`There is no account for email '${credentials.email}'.`);
				await dispatch_onApplicationException.dispatchModuleAsync(apiException, this as Module);
				throw apiException;
			}

			if (results.length > 1)
				throw new BadImplementationException(`Too many accounts using this email: '${credentials.email}'`);

			return results[0];
		},
	};


	async findOrCreateByEmail(email: string, type: string = 'user'): Promise<DB_Account> {
		this.impl.fixEmail({email});
		email = email.toLowerCase();
		return this.runTransaction(async () => {
			try {
				const account = await this.impl.queryAccountByEmail({email});
				MemKey_AccountId.set(account._id);
				await this.impl.onAccountLogin(account);
				return account;
			} catch (e: any) {
				if ((e as ApiException).responseCode !== 401)
					throw e;

				const account = await this.impl.create({email, type});
				MemKey_AccountId.set(account._id);
				await this.impl.onAccountCreated(account);
				return account;
			}
		});
	}

	account = {
		create: async (createAccountRequest: API_UserAccount['createAccount']['Body']): Promise<API_UserAccount['createAccount']['Response']> => {
			this.impl.fixEmail(createAccountRequest);
			return this.runTransaction(async () => {
				const dbAccount = await this.impl.create(createAccountRequest);
				await this.impl.onAccountCreated(dbAccount);
				return dbAccount;
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
					await dispatch_OnAccountDeleted.dispatchModuleAsyncSerial(account);
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
			return {token: dbSession.sessionIdJwt};
		},
		invalidate: async (token: string) => await ModuleBE_SessionDB.delete.where({_id: md5(token)}),
		invalidateAll: async (accountId: string) => await ModuleBE_SessionDB.delete.where({accountId})
	};
}

export const ModuleBE_AccountDB = new ModuleBE_AccountDB_Class();
