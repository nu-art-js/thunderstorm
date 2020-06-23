/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
	auditBy,
	currentTimeMillies,
	Day,
	Dispatcher,
	generateHex,
	hashPasswordWithSalt,
	Module,
	__stringify
} from "@nu-art/ts-common";


import {
	FirebaseModule,
	FirestoreCollection
} from "@nu-art/firebase/backend";
import {
	DB_Account,
	DB_Session,
	HeaderKey_SessionId,
	Request_CreateAccount,
	Request_LoginAccount,
	Response_Auth,
	UI_Account
} from "./_imports";
import {
	ApiException,
	ExpressRequest,
	HeaderKey
} from "@nu-art/thunderstorm/backend";

export const Header_SessionId = new HeaderKey(HeaderKey_SessionId);

type Config = {
	projectId: string
}

export const Collection_Sessions = "user-account--sessions";
export const Collection_Accounts = "user-account--accounts";

export interface OnNewUserRegistered {
	__onNewUserRegistered(email: string): void;
}

export interface OnUserLogin {
	__onUserLogin(email: string): void;
}

const dispatch_onUserLogin = new Dispatcher<OnUserLogin, "__onUserLogin">("__onUserLogin");
const dispatch_onNewUserRegistered = new Dispatcher<OnNewUserRegistered, "__onNewUserRegistered">("__onNewUserRegistered");

export class AccountsModule_Class
	extends Module<Config> {

	private sessions!: FirestoreCollection<DB_Session>;
	private accounts!: FirestoreCollection<DB_Account>;

	protected init(): void {
		const firestore = FirebaseModule.createAdminSession(this.config.projectId).getFirestore();
		this.sessions = firestore.getCollection<DB_Session>(Collection_Sessions, ["userId"]);
		this.accounts = firestore.getCollection<DB_Account>(Collection_Accounts, ["email"]);
	}

	async getUser(_email: string) {
		const email = _email.toLowerCase();
		return this.accounts.queryUnique({where: {email}});
	}

	async listUsers() {
		return this.accounts.getAll(["_id", "email"]) as Promise<{ email: string, _id: string }[]>;
	}

	async listSessions() {
		return this.sessions.getAll(["userId", "timestamp"]);
	}

	async getSession(_email: string) {
		const email = _email.toLowerCase();
		return this.accounts.queryUnique({where: {email}});
	}

	async create(request: Request_CreateAccount) {
		await this.createAccount(request);

		await dispatch_onNewUserRegistered.dispatchModuleAsync([request.email]);

		return this.login(request);
	}

	async createAccount(request: Request_CreateAccount) {
		request.email = request.email.toLowerCase();

		return this.accounts.runInTransaction(async (transaction) => {
			let account = await transaction.queryUnique(this.accounts, {where: {email: request.email}});
			if (account)
				throw new ApiException(422, "User with email already exists");

			const salt = generateHex(32);
			account = {
				_id: generateHex(32),
				_audit: auditBy(request.email),
				email: request.email,
				salt,
				saltedPassword: hashPasswordWithSalt(salt, request.password),
			};

			return transaction.insert(this.accounts, account);
		});
	}

	async login(request: Request_LoginAccount): Promise<Response_Auth> {
		request.email = request.email.toLowerCase();
		const query = {where: {email: request.email}};
		const account = await this.accounts.queryUnique(query);
		if (!account)
			throw new ApiException(401, "account does not exists");

		if (!account.saltedPassword || !account.salt)
			throw new ApiException(401, "Account login using SAML");

		if (account.saltedPassword !== hashPasswordWithSalt(account.salt, request.password))
			throw new ApiException(401, "wrong username or password");

		if (!account._id) {
			account._id = generateHex(32);
			await this.accounts.upsert(account);
		}

		await dispatch_onUserLogin.dispatchModuleAsync([request.email]);
		return this.upsertSession(account._id);
	}

	async loginSAML(_email: string): Promise<Response_Auth> {
		const email = _email.toLowerCase();
		const account = await this.createSAML(email);

		await dispatch_onUserLogin.dispatchModuleAsync([email]);
		return this.upsertSession(account._id);
	}

	private async createSAML(_email: string) {
		const email = _email.toLowerCase();
		const query = {where: {email}};
		const account = await this.accounts.runInTransaction(async (transaction) => {
			let _account = await transaction.queryUnique(this.accounts, query);
			if (!_account) {
				_account = {
					_id: generateHex(32),
					_audit: auditBy(email),
					email,
				};

				await transaction.insert(this.accounts, _account);
			}

			if (!_account._id) {
				_account._id = generateHex(32);
				await transaction.upsert(this.accounts, _account);
			}

			return _account;
		});

		await dispatch_onNewUserRegistered.dispatchModuleAsync([email]);
		return account;
	}

	async validateSession(request: ExpressRequest): Promise<UI_Account> {
		const sessionId = Header_SessionId.get(request);
		if(!sessionId)
			throw new ApiException(404, 'Missing sessionId');

		return this.validateSessionId(sessionId);
	}

	async validateSessionId(sessionId: string) {
		const query = {where: {sessionId}};

		const session = await this.sessions.queryUnique(query);
		if (!session)
			throw new ApiException(401, `Invalid session id: ${sessionId}`);

		if (this.TTLExpired(session))
			throw new ApiException(401, "Session timed out");

		return await this.getUserEmailFromSession(session);
	}

	private async getUserEmailFromSession(session: DB_Session) {
		const account = await this.accounts.queryUnique({where: {_id: session.userId}})
		if (!account) {
			await this.sessions.deleteItem(session);
			throw new ApiException(403, `No user found for session: ${__stringify(session)}`);
		}

		const {email, _id} = account;
		return {email, _id};
	}

	private TTLExpired = (session: DB_Session) => {
		const delta = currentTimeMillies() - session.timestamp;
		return delta > Day || delta < 0
	};

	private upsertSession = async (userId: string): Promise<Response_Auth> => {
		let session = await this.sessions.queryUnique({where: {userId}});
		if (!session || this.TTLExpired(session)) {
			session = {
				sessionId: generateHex(64),
				timestamp: currentTimeMillies(),
				userId
			};
			await this.sessions.upsert(session);
		}

		const account = await this.getUserEmailFromSession(session);
		return {sessionId: session.sessionId, email: account.email};
	};
}

export const AccountModule = new AccountsModule_Class();
