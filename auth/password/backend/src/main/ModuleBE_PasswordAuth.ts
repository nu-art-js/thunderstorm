import {
	ApiException,
	compare,
	generateHex,
	hashPasswordWithSalt,
	Module,
} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {HttpCodes} from '@nu-art/api-types';
import {
	_SessionKey_PasswordAuth,
	AccountToAssertPassword,
	API_PasswordAuth,
	ApiDef_PasswordAuth,
	assertPasswordRules,
	DB_PasswordCredentials,
	PasswordAssertionConfig,
	PasswordAssertionResponseError,
} from '@nu-art/password-auth-shared';
import {DB_Account} from '@nu-art/user-account-shared';
import {ModuleBE_AccountDB} from '@nu-art/user-account-backend';
import {BaseSessionClaims, CollectSessionData, MemKey_AccountEmail, MemKey_AccountId, MemKey_DB_Session, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {ModuleBE_FailedLoginAttemptDB} from './_entity/failed-login-attempt/ModuleBE_FailedLoginAttemptDB.js';
import {ModuleBE_PasswordCredentialDB} from './_entity/password-credentials/ModuleBE_PasswordCredentialDB.js';

type Config = {
	canRegister: boolean
	passwordAssertion?: PasswordAssertionConfig
	ignorePasswordAssertion?: boolean
}

export class ModuleBE_PasswordAuth_Class
	extends Module<Config>
	implements CollectSessionData<_SessionKey_PasswordAuth> {

	constructor() {
		super();
		this.setDefaultConfig({canRegister: false});
	}

	async __collectSessionData(data: BaseSessionClaims) {
		const credentials = (await ModuleBE_PasswordCredentialDB.query.custom({
			where: {accountId: data.accountId},
			limit: 1
		}))[0];
		return {
			key: 'passwordAuth' as const,
			value: {hasPassword: !!credentials},
		};
	}

	@ApiHandler(ApiDef_PasswordAuth.registerAccount)
	async registerAccount(body: API_PasswordAuth['registerAccount']['Body']): Promise<API_PasswordAuth['registerAccount']['Response']> {
		if (!this.config.canRegister)
			throw HttpCodes._4XX.IM_A_TEAPOT('Registration is disabled!!');

		ModuleBE_AccountDB.impl.fixEmail(body);
		this.password.assertPasswordCheck({email: body.email, password: body.password, passwordCheck: body.passwordCheck});

		const dbAccount = await ModuleBE_AccountDB.runTransaction(async () => {
			const dbAccount = await ModuleBE_AccountDB.impl.create({email: body.email, type: 'user'});
			await this.credentials.create(dbAccount, body.password);
			await ModuleBE_AccountDB.impl.setAccountMemKeys(dbAccount);
			await ModuleBE_AccountDB.impl.onAccountCreated(dbAccount);
			return dbAccount;
		});

		await this.account.login({email: body.email, deviceId: body.deviceId, password: body.password});
		return dbAccount;
	}

	@ApiHandler(ApiDef_PasswordAuth.login)
	async handleLogin(body: API_PasswordAuth['login']['Body']): Promise<API_PasswordAuth['login']['Response']> {
		return this.account.login(body);
	}

	@ApiHandler(ApiDef_PasswordAuth.changePassword)
	async changePassword(body: API_PasswordAuth['changePassword']['Body']): Promise<API_PasswordAuth['changePassword']['Response']> {
		return this.account.changePassword(body);
	}

	@ApiHandler(ApiDef_PasswordAuth.setPassword)
	async setPassword(body: API_PasswordAuth['setPassword']['Body']): Promise<API_PasswordAuth['setPassword']['Response']> {
		return this.account.setPassword(body);
	}

	@ApiHandler(ApiDef_PasswordAuth.getPasswordAssertionConfig)
	async getPasswordAssertionConfig(_params: API_PasswordAuth['getPasswordAssertionConfig']['Params']): Promise<API_PasswordAuth['getPasswordAssertionConfig']['Response']> {
		return {
			config: this.config.ignorePasswordAssertion
				? undefined
				: this.config.passwordAssertion
		};
	}

	private credentials = {
		create: async (account: DB_Account, password: string): Promise<DB_PasswordCredentials> => {
			const salt = generateHex(32);
			return ModuleBE_PasswordCredentialDB.create.item({
				accountId: account._id,
				salt,
				saltedPassword: hashPasswordWithSalt(salt, password),
			});
		},
		queryByAccountId: async (accountId: DB_Account['_id']): Promise<DB_PasswordCredentials | undefined> => {
			return (await ModuleBE_PasswordCredentialDB.query.custom({
				where: {accountId},
				limit: 1
			}))[0];
		},
	};

	private password = {
		assertPasswordExistence: (email: string, password?: string, passwordCheck?: string) => {
			if (!password || !passwordCheck)
				throw HttpCodes._4XX.BAD_REQUEST(`Did not receive a password`, `Did not receive a password for email ${email}.`);

			if (password !== passwordCheck)
				throw HttpCodes._4XX.BAD_REQUEST(`Password check does not match`, `Password does not match password check for email ${email}.`);
		},
		assertPasswordRules: (password: string) => {
			const assertPassword = assertPasswordRules(password, this.config.passwordAssertion);
			if (assertPassword)
				throw new ApiException<PasswordAssertionResponseError>(HttpCodes._4XX.PASSWORD_ASSERTION.code, `Password assertion failed`).setErrorBody({
					type: 'password-assertion-error',
					data: assertPassword,
				});
		},
		assertPasswordCheck: (accountToAssert: AccountToAssertPassword) => {
			this.password.assertPasswordExistence(accountToAssert.email, accountToAssert.password, accountToAssert.passwordCheck);
			this.password.assertPasswordRules(accountToAssert.password!);
		},
		assertPasswordMatch: async (credentials: DB_PasswordCredentials, password: string) => {
			if (hashPasswordWithSalt(credentials.salt, password) !== credentials.saltedPassword) {
				await ModuleBE_FailedLoginAttemptDB.updateFailedLoginAttempt(credentials.accountId);
				throw HttpCodes._4XX.UNAUTHORIZED('Wrong username or password.');
			}
		}
	};

	private account = {
		login: async (loginCredentials: API_PasswordAuth['login']['Body']): Promise<API_PasswordAuth['login']['Response']> => {
			this.logDebug(`login: attempting for email='${loginCredentials.email}' deviceId='${loginCredentials.deviceId}'`);
			ModuleBE_AccountDB.impl.fixEmail(loginCredentials);

			const dbAccount = await ModuleBE_AccountDB.impl.queryAccountByEmail({email: loginCredentials.email});
			if (dbAccount.type === 'service')
				throw HttpCodes._4XX.FORBIDDEN('Cannot use password authentication for service accounts');

			this.logDebug(`login: account found _id='${dbAccount._id}' type='${dbAccount.type}'`);

			const credentials = await this.credentials.queryByAccountId(dbAccount._id);
			if (!credentials)
				throw HttpCodes._4XX.UNAUTHORIZED('Account was never logged in using username and password, probably logged using SAML');

			await this.password.assertPasswordMatch(credentials, loginCredentials.password);
			this.logDebug(`login: password match OK`);

			MemKey_AccountId.set(dbAccount._id);
			await ModuleBE_AccountDB.impl.onAccountLogin(dbAccount);

			const initialClaims = {
				accountId: dbAccount._id,
				deviceId: loginCredentials.deviceId,
				label: 'password-login'
			};

			await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
			this.logDebug(`login: session created for _id='${dbAccount._id}'`);
			return dbAccount;
		},
		changePassword: async (passwordToChange: API_PasswordAuth['changePassword']['Body']): Promise<API_PasswordAuth['changePassword']['Response']> => {
			return ModuleBE_AccountDB.runTransaction(async () => {
				const email = MemKey_AccountEmail.get();
				const deviceId = MemKey_DB_Session.get().deviceId;
				await this.account.login({email, deviceId, password: passwordToChange.oldPassword});

				if (!compare(passwordToChange.password, passwordToChange.passwordCheck))
					throw HttpCodes._4XX.UNAUTHORIZED('Password check mismatch');

				this.password.assertPasswordCheck({
					email,
					password: passwordToChange.password,
					passwordCheck: passwordToChange.passwordCheck
				});

				const dbAccount = await ModuleBE_AccountDB.impl.queryAccountByEmail({email});
				const existingCredentials = await this.credentials.queryByAccountId(dbAccount._id);
				if (!existingCredentials)
					throw HttpCodes._4XX.UNAUTHORIZED('No password credentials found for this account');

				const salt = generateHex(32);
				await ModuleBE_PasswordCredentialDB.set.item({
					...existingCredentials,
					salt,
					saltedPassword: hashPasswordWithSalt(salt, passwordToChange.password),
				});

				const initialClaims = {
					accountId: dbAccount._id,
					deviceId,
					label: 'password-change'
				};

				await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
				return dbAccount;
			});
		},
		setPassword: async (passwordBody: API_PasswordAuth['setPassword']['Body']): Promise<API_PasswordAuth['setPassword']['Response']> => {
			return ModuleBE_AccountDB.runTransaction(async () => {
				const email = MemKey_AccountEmail.get();
				const deviceId = MemKey_DB_Session.get().deviceId;

				const dbAccount = await ModuleBE_AccountDB.impl.queryAccountByEmail({email});
				if (dbAccount.type === 'service')
					throw HttpCodes._4XX.FORBIDDEN('Cannot use password authentication for service accounts');

				const existingCredentials = await this.credentials.queryByAccountId(dbAccount._id);
				if (existingCredentials)
					throw HttpCodes._4XX.FORBIDDEN('account already has password');

				this.password.assertPasswordCheck({email, ...passwordBody});
				await this.credentials.create(dbAccount, passwordBody.password);

				const initialClaims = {
					accountId: dbAccount._id,
					deviceId,
					label: 'password-set'
				};

				await ModuleBE_SessionDB._session.create.andReturn({initialClaims});
				return dbAccount;
			});
		},
	};
}

export const ModuleBE_PasswordAuth = new ModuleBE_PasswordAuth_Class();
