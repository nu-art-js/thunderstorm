import * as React from 'react';
import {ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {apiWithBody, apiWithQuery, ModuleFE_XHR, readFileContent, StorageKey, ThunderDispatcher} from '@nu-art/thunderstorm-frontend/index';
import {ApiDefCaller, HeaderKey_DeviceId, HeaderKey_TabId} from '@nu-art/thunderstorm-shared';
import {dispatcher_onAuthRequired} from '@nu-art/thunderstorm-shared/no-auth-listener';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {
	Account_ChangeThumbnail,
	Account_GetPasswordAssertionConfig,
	AccountCrudTypes,
	API_SAML,
	API_UserAccount,
	ApiDef_SAML,
	ApiDef_UserAccount,
	DB_Account,
	DBDef_Accounts,
	PasswordAssertionConfig,
	QueryParam_SessionId,
	SAML_Login,
	UI_Account
} from '@nu-art/user-account-shared';
import type {BaseDBConfig} from '@nu-art/db-api-frontend';
import {SessionKeyFE_Account, StorageKey_DeviceId, StorageKey_TabId} from './consts.js';
import {ApiCallerEventType} from '@nu-art/thunderstorm-frontend/core/db-api-gen/types';
import {asArray, cloneObj, composeUrl, DB_BaseObject, Exception, generateHex, KB, TS_Object} from '@nu-art/ts-common';
import {ModuleFE_Session, OnSessionUpdated} from '../session/ModuleFE_Session.js';


export interface OnLoginStatusUpdated {
	__onLoginStatusUpdated: () => void;
}

export interface OnAccountsUpdated {
	__onAccountsUpdated: (...params: ApiCallerEventType<AccountCrudTypes>) => void;
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

type ApiDefCaller_Account = ApiDefCaller<API_UserAccount & API_SAML>;

const accountBaseConfig: BaseDBConfig<AccountCrudTypes> = {
	dbKey: DBDef_Accounts.dbKey,
	validator: DBDef_Accounts.modifiablePropsValidator,
	uniqueKeys: (DBDef_Accounts.uniqueKeys ?? ['_id']) as AccountCrudTypes['uniqueKeys'],
	versions: DBDef_Accounts.versions,
	dbConfig: {
		name: DBDef_Accounts.frontend?.name ?? DBDef_Accounts.dbKey,
		group: DBDef_Accounts.frontend?.group ?? 'default',
		version: DBDef_Accounts.versions[0],
		uniqueKeys: (DBDef_Accounts.uniqueKeys ?? ['_id']) as (keyof DB_Account)[]
	}
};

const accountDispatcher = {
	dispatchModule: () => dispatch_onAccountsUpdated.dispatchModule(),
	dispatchUI: () => dispatch_onAccountsUpdated.dispatchUI(),
	dispatchAll: () => {
		dispatch_onAccountsUpdated.dispatchModule();
		dispatch_onAccountsUpdated.dispatchUI();
	}
};

class ModuleFE_Account_Class
	extends ModuleFE_BaseApi<AccountCrudTypes>
	implements ApiDefCaller_Account, OnLoginStatusUpdated, OnSessionUpdated {

	readonly _v1: ApiDefCaller_Account;
	private status: LoggedStatus = LoggedStatus.LOGGED_OUT;

	__onLoginStatusUpdated() {
		if ([LoggedStatus.LOGGED_OUT, LoggedStatus.SESSION_TIMEOUT].includes(this.status))
			this._v1.getPasswordAssertionConfig({}).executeSync();
	}

	constructor() {
		super({
			config: accountBaseConfig,
			crudApiDef: CrudApiDef<AccountCrudTypes>(DBDef_Accounts.dbKey),
			dispatcher: accountDispatcher
		});
		this._v1 = {
			refreshSession: apiWithQuery(ApiDef_UserAccount.refreshSession),
			registerAccount: apiWithBody(ApiDef_UserAccount.registerAccount),
			createAccount: apiWithBody(ApiDef_UserAccount.createAccount, this.onAccountCreated),
			changePassword: apiWithBody(ApiDef_UserAccount.changePassword),
			login: apiWithBody(ApiDef_UserAccount.login),
			logout: apiWithQuery(ApiDef_UserAccount.logout),
			createToken: apiWithBody(ApiDef_UserAccount.createToken),
			setPassword: apiWithBody(ApiDef_UserAccount.setPassword),
			getSessions: apiWithQuery(ApiDef_UserAccount.getSessions),
			changeThumbnail: apiWithBody(ApiDef_UserAccount.changeThumbnail, this.onThumbnailChanged),
			loginSaml: apiWithQuery(ApiDef_SAML.loginSaml, this.onLoginCompletedSAML),
			assertSAML: apiWithBody(ApiDef_SAML.assertSAML),
			getPasswordAssertionConfig: apiWithQuery(ApiDef_UserAccount.getPasswordAssertionConfig, this.onPasswordAssertionConfig)
		};
	}

	protected init(): void {
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

		ModuleFE_XHR.addDefaultHeader(HeaderKey_DeviceId, () => defaultDeviceId!);
		ModuleFE_XHR.addDefaultHeader(HeaderKey_TabId, defaultTabId!);
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
		await this._v1.logout({}).executeSync();
		dispatcher_onAuthRequired.dispatchModule(undefined);
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
				await this._v1.changeThumbnail({accountId: account._id, hash}).executeSync();
			} catch (err: any) {
				this.logError(err.message, err);
			}
		});
		input.click();
	};

	private encodeFile = async (file: File) => {
		const arrayBuffer: ArrayBuffer = await readFileContent(file);
		if (arrayBuffer.byteLength > 200 * KB)
			throw new Exception('File size exceeds 200KB');

		const buffer = new Uint8Array(arrayBuffer);
		return window.btoa(buffer.reduce((acc, byte) => acc + String.fromCharCode(byte), ''));
	};

	public getPasswordAssertionConfig = () => StorageKey_PasswordAssertionConfig.get();

	public getCurrentlyLoggedAccount = () => {
		return SessionKeyFE_Account.get();
	};

	
	private onAccountCreated = async (response: UI_Account & DB_BaseObject) => {
		await this.onEntriesUpdated([response as DB_Account]);
	};

	private onThumbnailChanged = async (response: { account: DB_Account }) => {
		await this.onEntryUpdated(response.account, response.account);
	};

	private onLoginCompletedSAML = async (response: SAML_Login['response']) => {
		if (!response.loginUrl)
			return;

		window.location.href = response.loginUrl;
	};

	private onPasswordAssertionConfig = async (response: { config: PasswordAssertionConfig | undefined }) => {
		StorageKey_PasswordAssertionConfig.set(response.config);
	};
}

export const ModuleFE_Account = new ModuleFE_Account_Class();