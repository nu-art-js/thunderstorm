import * as React from 'react';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallContext, ApiCaller, HttpClient} from '@nu-art/http-client';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {
	API_SAML,
	API_UserAccount,
	ApiDef_SAML,
	ApiDef_UserAccount,
	DatabaseDef_Account,
	DB_Account,
	DBDef_Accounts,
	HeaderKey_DeviceId,
	HeaderKey_TabId,
	PasswordAssertionConfig,
	QueryParam_SessionId,
	UI_Account
} from '@nu-art/user-account-shared';
import {SessionKeyFE_Account, StorageKey_DeviceId, StorageKey_TabId} from './consts.js';
import {asArray, cloneObj, composeUrl, Exception, generateHex, KB, TS_Object} from '@nu-art/ts-common';
import {ModuleFE_Session, OnSessionUpdated} from '../session/ModuleFE_Session.js';
import {readFileAs_ArrayBuffer, StorageKey, ThunderDispatcher} from '@nu-art/thunder-core';
import {dispatcher_onAuthRequired} from '../session/no-auth-listener.js';


export interface OnLoginStatusUpdated {
	__onLoginStatusUpdated: () => void;
}

export interface OnAccountsUpdated {
	__onAccountsUpdated: (...params: ApiCallerEventType<DB_Account>) => void;
}

export enum LoggedStatus {
	VALIDATING,
	LOGGED_OUT,
	SESSION_TIMEOUT,
	LOGGED_IN
}

export const dispatch_onLoginStatusChanged = new ThunderDispatcher<OnLoginStatusUpdated, '__onLoginStatusUpdated'>('__onLoginStatusUpdated');
export const dispatch_onAccountsUpdated = new ThunderDispatcher<OnAccountsUpdated, '__onAccountsUpdated'>('__onAccountsUpdated');
const StorageKey_PasswordAssertionConfig = new StorageKey<PasswordAssertionConfig | undefined>('account__password-assertion-config', false);

const accountBaseConfig = {
	dbKey: DBDef_Accounts.dbKey,
	validator: DBDef_Accounts.modifiablePropsValidator,
	uniqueKeys: (DBDef_Accounts.uniqueKeys ?? ['_id']),
	versions: DBDef_Accounts.versions,
	dbConfig: {
		name: DBDef_Accounts.frontend?.name ?? DBDef_Accounts.dbKey,
		group: DBDef_Accounts.frontend?.group ?? 'default',
		version: DBDef_Accounts.versions[0],
		uniqueKeys: (DBDef_Accounts.uniqueKeys ?? ['_id']) as (keyof DB_Account)[]
	}
};


class ModuleFE_Account_Class
	extends ModuleFE_BaseApi<DatabaseDef_Account>
	implements OnLoginStatusUpdated, OnSessionUpdated {

	private status: LoggedStatus = LoggedStatus.LOGGED_OUT;

	__onLoginStatusUpdated() {
		if ([LoggedStatus.LOGGED_OUT, LoggedStatus.SESSION_TIMEOUT].includes(this.status))
			void this.getPasswordAssertionConfig({});
	}

	constructor() {
		super({
			config: accountBaseConfig,
			crudApiDef: CrudApiDef<DatabaseDef_Account>(DBDef_Accounts.dbKey),
			dispatcher: () => {
			}
		});
	}

	@ApiCaller(ApiDef_UserAccount.refreshSession)
	async refreshSession(_params?: API_UserAccount['refreshSession']['Params']): Promise<API_UserAccount['refreshSession']['Response']> {
		return undefined as unknown as API_UserAccount['refreshSession']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.registerAccount)
	async registerAccount(body: API_UserAccount['registerAccount']['Body']): Promise<API_UserAccount['registerAccount']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['registerAccount']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.createAccount, {onComplete: (m: ModuleFE_Account_Class, ctx: ApiCallContext<API_UserAccount['createAccount']>) => m.onAccountCreated(ctx)})
	async createAccount(body: API_UserAccount['createAccount']['Body']): Promise<API_UserAccount['createAccount']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['createAccount']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.changePassword)
	async changePassword(body: API_UserAccount['changePassword']['Body']): Promise<API_UserAccount['changePassword']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['changePassword']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.login)
	async login(body: API_UserAccount['login']['Body']): Promise<API_UserAccount['login']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['login']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.logout)
	async logoutApi(_params?: API_UserAccount['logout']['Params']): Promise<API_UserAccount['logout']['Response']> {
		return undefined as unknown as API_UserAccount['logout']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.createToken)
	async createToken(body: API_UserAccount['createToken']['Body']): Promise<API_UserAccount['createToken']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['createToken']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.setPassword)
	async setPassword(body: API_UserAccount['setPassword']['Body']): Promise<API_UserAccount['setPassword']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['setPassword']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.getSessions)
	async getSessions(params: API_UserAccount['getSessions']['Params']): Promise<API_UserAccount['getSessions']['Response']> {
		void params;
		return undefined as unknown as API_UserAccount['getSessions']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.changeThumbnail, {onComplete: (m: ModuleFE_Account_Class, ctx: ApiCallContext<API_UserAccount['changeThumbnail']>) => m.onThumbnailChanged(ctx)})
	async changeThumbnail(body: API_UserAccount['changeThumbnail']['Body']): Promise<API_UserAccount['changeThumbnail']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['changeThumbnail']['Response'];
	}

	@ApiCaller(ApiDef_SAML.loginSaml, {onComplete: (m: ModuleFE_Account_Class, ctx: ApiCallContext<API_SAML['loginSaml']>) => m.onLoginCompletedSAML(ctx)})
	async loginSaml(params: API_SAML['loginSaml']['Params']): Promise<API_SAML['loginSaml']['Response']> {
		void params;
		return undefined as unknown as API_SAML['loginSaml']['Response'];
	}

	@ApiCaller(ApiDef_SAML.assertSAML)
	async assertSAML(body: API_SAML['assertSAML']['Body']): Promise<API_SAML['assertSAML']['Response']> {
		void body;
		return undefined as unknown as API_SAML['assertSAML']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.getPasswordAssertionConfig, {onComplete: (m: ModuleFE_Account_Class, ctx: ApiCallContext<API_UserAccount['getPasswordAssertionConfig']>) => m.onPasswordAssertionConfig(ctx)})
	async getPasswordAssertionConfig(_params?: API_UserAccount['getPasswordAssertionConfig']['Params']): Promise<API_UserAccount['getPasswordAssertionConfig']['Response']> {
		return undefined as unknown as API_UserAccount['getPasswordAssertionConfig']['Response'];
	}

	protected init() {
		super.init();

		let defaultTabId = StorageKey_TabId.get();
		let defaultDeviceId = StorageKey_DeviceId.get();

		if (!defaultDeviceId) {
			defaultDeviceId = generateHex(32);
			console.log(`Defining new device Id: ${defaultDeviceId}`);
			StorageKey_DeviceId.set(defaultDeviceId);
		}

		if (!defaultTabId) {
			defaultTabId = generateHex(32);
			console.log(`Defining new tab Id: ${defaultTabId}`);
			StorageKey_TabId.set(defaultTabId);
		}

		HttpClient.default.addDefaultHeader(HeaderKey_DeviceId, () => defaultDeviceId!);
		HttpClient.default.addDefaultHeader(HeaderKey_TabId, () => defaultTabId!);
	}


	getAccounts() {
		return this.cache.all().map(i => cloneObj(i)) as UI_Account[];
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatus | LoggedStatus[]) => asArray(status).includes(this.status);

	__onSessionUpdated() {
		if (!ModuleFE_Session.hasSession())
			return this.setLoggedStatus(LoggedStatus.LOGGED_OUT);

		if (!ModuleFE_Session.isSessionValid())
			return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);

		return this.setLoggedStatus(LoggedStatus.LOGGED_IN);
	}

	protected setLoggedStatus = (newStatus: LoggedStatus) => {
		if (this.status === newStatus)
			return;

		const pervStatus = this.status;
		this.status = newStatus;

		this.logInfo(`Login status changes: ${LoggedStatus[pervStatus]} => ${LoggedStatus[newStatus]}`);
		dispatch_onLoginStatusChanged.dispatchUI();
		dispatch_onLoginStatusChanged.dispatchModule();
	};

	public composeSAMLUrl = () => {
		const params = new URLSearchParams(window.location.search);
		const paramsObj: TS_Object = {};
		for (const [key, value] of params) {
			paramsObj[key] = value;
		}

		return composeUrl(window.location.origin + window.location.pathname, {
			...paramsObj,
			[QueryParam_SessionId]: QueryParam_SessionId.toUpperCase(),
		});
	};


	logout = async (url?: string) => {
		await this.logoutApi({});
		dispatcher_onAuthRequired.dispatchModule();
		if (url)
			return window.location.href = url;
	};

	uploadAccountThumbnail = (e: React.MouseEvent, account: DB_Account) => {
		const input = document.createElement('input');
		input.type = 'file';
		// input.accept = '.jpg,.jpeg,.png';
		input.style.display = 'none';
		input.addEventListener('change', async e => {
			const file = input.files![0];
			if (!file)
				return;

			try {
				const hash = await this.encodeFile(file);
				await this.changeThumbnail({accountId: account._id, hash});
			} catch (err: any) {
				this.logError(err.message, err);
			}
		});
		input.click();
	};

	private encodeFile = async (file: File) => {
		const arrayBuffer: ArrayBuffer = await readFileAs_ArrayBuffer(file);
		if (arrayBuffer.byteLength > 200 * KB)
			throw new Exception('File size exceeds 200KB');

		const buffer = new Uint8Array(arrayBuffer);
		return window.btoa(buffer.reduce((acc, byte) => acc + String.fromCharCode(byte), ''));
	};

	public passwordAssertionConfig = () => StorageKey_PasswordAssertionConfig.get();

	public getCurrentlyLoggedAccount = () => {
		return SessionKeyFE_Account.get();
	};


	private onAccountCreated = async (ctx: ApiCallContext<API_UserAccount['createAccount']>) => {
		await this.onEntriesUpdated([ctx.response as DB_Account]);
	};

	private onThumbnailChanged = async (ctx: ApiCallContext<API_UserAccount['changeThumbnail']>) => {
		await this.onEntryUpdated(ctx.response.account, ctx.response.account);
	};

	private onLoginCompletedSAML = async (ctx: ApiCallContext<API_SAML['loginSaml']>) => {
		if (!ctx.response.loginUrl)
			return;

		window.location.href = ctx.response.loginUrl;
	};

	private onPasswordAssertionConfig = async (ctx: ApiCallContext<API_UserAccount['getPasswordAssertionConfig']>) => {
		StorageKey_PasswordAssertionConfig.set(ctx.response.config);
	};
}

export const ModuleFE_Account = new ModuleFE_Account_Class();