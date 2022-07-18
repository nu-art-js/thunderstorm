/*
 * User secured registration and login management system..
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
	__stringify,
	auditBy,
	currentTimeMillis,
	Day,
	Dispatcher,
	generateHex,
	hashPasswordWithSalt,
	Module,
	MUSTNeverHappenException,
	tsValidate
} from '@nu-art/ts-common';

import {FirebaseModule, FirestoreCollection, FirestoreTransaction} from '@nu-art/firebase/backend';
import {
	ApiDef_UserAccountBE,
	ApiStruct_UserAccountBE,
	DB_Account,
	DB_Session,
	HeaderKey_SessionId,
	Request_CreateAccount,
	Request_LoginAccount,
	Request_UpsertAccount,
	Response_Auth,
	UI_Account
} from './_imports';
import {
	ApiDefServer,
	ApiException,
	ApiModule,
	createBodyServerApi,
	createQueryServerApi,
	ExpressRequest,
	HeaderKey,
	QueryRequestInfo
} from '@nu-art/thunderstorm/backend';
import {tsValidateEmail} from '@nu-art/db-api-generator/shared/validators';
import {QueryParams} from '@nu-art/thunderstorm';


export const Header_SessionId = new HeaderKey(HeaderKey_SessionId);

type Config = {
	projectId: string
	canRegister: boolean
	sessionTTLms: number
}

export const Collection_Sessions = 'user-account--sessions';
export const Collection_Accounts = 'user-account--accounts';

export interface OnNewUserRegistered {
	__onNewUserRegistered(account: UI_Account): void;
}

export interface OnUserLogin {
	__onUserLogin(account: UI_Account): void;
}

const dispatch_onUserLogin = new Dispatcher<OnUserLogin, '__onUserLogin'>('__onUserLogin');
export const dispatch_onNewUserRegistered = new Dispatcher<OnNewUserRegistered, '__onNewUserRegistered'>('__onNewUserRegistered');

function getUIAccount(account: DB_Account): UI_Account {
	const {email, _id} = account;
	return {email, _id};
}

export class AccountModuleBE_Class
	extends Module<Config>
	implements QueryRequestInfo, ApiDefServer<ApiStruct_UserAccountBE>, ApiModule {

	readonly v1: ApiDefServer<ApiStruct_UserAccountBE>['v1'];

	constructor() {
		super();
		this.setDefaultConfig({sessionTTLms: Day});
		this.v1 = {
			create: createBodyServerApi(ApiDef_UserAccountBE.v1.create, this.create),
			login: createBodyServerApi(ApiDef_UserAccountBE.v1.login, this.login),
			validateSession: createQueryServerApi(ApiDef_UserAccountBE.v1.validateSession, this.validateSession),
			query: createQueryServerApi(ApiDef_UserAccountBE.v1.query, this.listUsers),
			upsert: createBodyServerApi(ApiDef_UserAccountBE.v1.upsert, this.upsert),
		};
	}

	useRoutes() {
		return this.v1;
	}

	async __queryRequestInfo(request: ExpressRequest): Promise<{ key: string; data: any; }> {
		let data: UI_Account | undefined;
		try {
			data = await this.validateSession({}, request);
		} catch (e: any) {
			this.logError(e);
		}

		return {
			key: this.getName(),
			data: data
		};
	}

	private sessions!: FirestoreCollection<DB_Session>;
	private accounts!: FirestoreCollection<DB_Account>;

	protected init(): void {
		const firestore = FirebaseModule.createAdminSession(this.config.projectId).getFirestore();
		this.sessions = firestore.getCollection<DB_Session>(Collection_Sessions, ['userId']);
		this.accounts = firestore.getCollection<DB_Account>(Collection_Accounts, ['email']);
	}

	async getUser(_email: string): Promise<UI_Account | undefined> {
		const email = _email.toLowerCase();
		return this.accounts.queryUnique({where: {email}, select: ['email', '_id']});
	}

	async listUsers(params: QueryParams) {
		return {accounts: (await this.accounts.getAll(['_id', 'email'])) as { email: string, _id: string }[]};
	}

	async listSessions() {
		return this.sessions.getAll(['userId', 'timestamp']);
	}

	async getSession(_email: string) {
		const email = _email.toLowerCase();
		return this.accounts.queryUnique({where: {email}});
	}

	private async create(request: Request_CreateAccount) {
		const account = await this.createAccount(request);

		const session = await this.login(request);
		await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccount(account));
		return session;
	}

	private async upsert(request: Request_UpsertAccount) {
		const account = await this.accounts.runInTransaction(async (transaction) => {
			const existAccount = await transaction.queryUnique(this.accounts, {where: {email: request.email}});
			if (existAccount)
				return this.changePassword(request.email, request.password, transaction);

			return this.createImpl(request, transaction);
		});

		const session = await this.login(request);
		await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccount(account));
		return session;
	}

	// async addNewAccount(email: string, password?: string, password_check?: string): Promise<UI_Account> {
	// 	let account: DB_Account;
	// 	if (password && password_check) {
	// 		account = await this.createAccount({password, password_check, email});
	// 		await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccount(account));
	// 	} else
	// 		account = await this.createSAML(email);
	//
	// 	return getUIAccount(account);
	// }

	async changePassword(userEmail: string, newPassword: string, outsideTransaction: FirestoreTransaction) {
		const email = userEmail.toLowerCase();
		return this.accounts.runInTransaction(async (innerTransaction) => {
			const transaction = outsideTransaction || innerTransaction;
			const account = await transaction.queryUnique(this.accounts, {where: {email}});
			if (!account)
				throw new ApiException(422, 'User with email does not exist');

			if (!account.saltedPassword || !account.salt)
				throw new ApiException(401, 'Account login using SAML');

			account.saltedPassword = hashPasswordWithSalt(account.salt, newPassword);
			account._audit = auditBy(email, 'Changed password');

			return transaction.upsert(this.accounts, account);
		});
	}

	async createAccount(request: Request_CreateAccount) {
		request.email = request.email.toLowerCase();
		tsValidate(request.email, tsValidateEmail);

		return this.accounts.runInTransaction(async (transaction: FirestoreTransaction) => {
			const account = await transaction.queryUnique(this.accounts, {where: {email: request.email}});
			if (account)
				throw new ApiException(422, 'User with email already exists');

			return this.createImpl(request, transaction);
		});
	}

	private createImpl(request: Request_CreateAccount, transaction: FirestoreTransaction) {
		if (!this.config.canRegister)
			throw new ApiException(418, 'Registration is disabled!!');

		const salt = generateHex(32);
		const now = currentTimeMillis();
		const account = {
			_id: generateHex(32),
			__created: now,
			__updated: now,
			_audit: auditBy(request.email),
			email: request.email,
			salt,
			saltedPassword: hashPasswordWithSalt(salt, request.password)
		};

		return transaction.insert(this.accounts, account);
	}

	async login(request: Request_LoginAccount): Promise<Response_Auth> {
		request.email = request.email.toLowerCase();
		const query = {where: {email: request.email}};
		const account = await this.accounts.queryUnique(query);
		if (!account)
			throw new ApiException(401, 'account does not exists');

		if (!account.saltedPassword || !account.salt)
			throw new ApiException(401, 'Account login using SAML');

		if (account.saltedPassword !== hashPasswordWithSalt(account.salt, request.password))
			throw new ApiException(401, 'wrong username or password');

		if (!account._id) {
			account._id = generateHex(32);
			await this.accounts.upsert(account);
		}

		const session = await this.upsertSession(account);

		await dispatch_onUserLogin.dispatchModuleAsync(getUIAccount(account));
		return session;
	}

	async validateSession(params: QueryParams, request?: ExpressRequest): Promise<UI_Account> {
		if (!request)
			throw new MUSTNeverHappenException('must have a request when calling this function..');

		const sessionId = Header_SessionId.get(request);
		if (!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		return this.validateSessionId(sessionId);
	}

	async validateSessionId(sessionId: any) {
		if (typeof sessionId !== 'string')
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		const query = {where: {sessionId}};

		const session = await this.sessions.queryUnique(query);
		if (!session)
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		if (this.TTLExpired(session))
			throw new ApiException(401, 'Session timed out');

		return await this.getUserEmailFromSession(session);
	}

	private async getUserEmailFromSession(session: DB_Session) {
		const account = await this.accounts.queryUnique({where: {_id: session.userId}});
		if (!account) {
			await this.sessions.deleteItem(session);
			throw new ApiException(403, `No user found for session: ${__stringify(session)}`);
		}

		return getUIAccount(account);
	}

	private TTLExpired = (session: DB_Session) => {
		const delta = currentTimeMillis() - session.timestamp;
		return delta > this.config.sessionTTLms || delta < 0;
	};

	upsertSession = async (account: DB_Account): Promise<Response_Auth> => {
		let session = await this.sessions.queryUnique({where: {userId: account._id}});
		if (!session || this.TTLExpired(session)) {
			session = {
				sessionId: generateHex(64),
				timestamp: currentTimeMillis(),
				userId: account._id
			};
			await this.sessions.upsert(session);
		}

		const uiAccount = await this.getUserEmailFromSession(session);
		await dispatch_onUserLogin.dispatchModuleAsync(uiAccount);
		return {sessionId: session.sessionId, email: uiAccount.email};
	};

	async getOrCreate(query: { where: { email: string } }) {
		let dispatchEvent = false;

		const dbAccount = await this.accounts.runInTransaction<DB_Account>(async (transaction: FirestoreTransaction) => {
			const account = await transaction.queryUnique(this.accounts, query);
			if (account?._id)
				return account;

			const now = currentTimeMillis();
			const _account: DB_Account = {
				_id: generateHex(32),
				__created: now,
				__updated: now,
				_audit: auditBy(query.where.email),
				email: query.where.email,
				...account
			};

			dispatchEvent = true;
			return transaction.upsert(this.accounts, _account);
		});

		if (dispatchEvent)
			await dispatch_onNewUserRegistered.dispatchModuleAsync(getUIAccount(dbAccount));

		return dbAccount;
	}
}

export const ModuleBE_Account = new AccountModuleBE_Class();
