import * as React from 'react';
import {apiWithBody, apiWithQuery, ModuleFE_BaseApi, ModuleFE_XHR, readFileContent, StorageKey, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller, HeaderKey_DeviceId, HeaderKey_TabId} from '@nu-art/thunderstorm';
import {dispatcher_onAuthRequired} from '@nu-art/thunderstorm/shared/no-auth-listener';
import {
	Account_ChangeThumbnail,
	Account_GetPasswordAssertionConfig,
	ApiDef_Account,
	ApiDef_SAML,
	ApiStruct_Account,
	ApiStruct_SAML,
	DB_Account,
	DBDef_Accounts,
	DBProto_Account,
	QueryParam_SessionId,
	SAML_Login,
	UI_Account
} from '../shared/index.js';
import {SessionKeyFE_Account, StorageKey_DeviceId, StorageKey_TabId} from './consts.js';
import {PasswordAssertionConfig} from '../../_enum.js';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ModuleFE_Session, OnSessionUpdated} from '../../session/frontend/ModuleFE_Session.js';
import {asArray, cloneObj, composeUrl, DB_BaseObject, Exception, generateHex, KB, TS_Object} from '@nu-art/ts-common';


export interface OnLoginStatusUpdated {
	__onLoginStatusUpdated: () => void;
}

export interface OnAccountsUpdated {
	__onAccountsUpdated: (...params: ApiCallerEventType<DBProto_Account>) => void;
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

type ApiDefCaller_Account = ApiDefCaller<{ _v1: ApiStruct_Account['_v1'] & ApiStruct_SAML['_v1'] }>;

class ModuleFE_Account_Class
	extends ModuleFE_BaseApi<DBProto_Account>
	implements ApiDefCaller_Account, OnLoginStatusUpdated, OnSessionUpdated {

	readonly _v1: ApiDefCaller_Account['_v1'];
	private status: LoggedStatus = LoggedStatus.LOGGED_OUT;

	__onLoginStatusUpdated() {
		//Get the password assertion config if needed
		if ([LoggedStatus.LOGGED_OUT, LoggedStatus.SESSION_TIMEOUT].includes(this.status))
			this._v1.getPasswordAssertionConfig({}).executeSync();
	}


	constructor() {
		super(DBDef_Accounts, dispatch_onAccountsUpdated);
		// const login = apiWithBody(ApiDef_Account._v1.login, this.setLoginInfo);
		this._v1 = {
			refreshSession: apiWithQuery(ApiDef_Account._v1.refreshSession),
			registerAccount: apiWithBody(ApiDef_Account._v1.registerAccount),
			createAccount: apiWithBody(ApiDef_Account._v1.createAccount, this.onAccountCreated),
			changePassword: apiWithBody(ApiDef_Account._v1.changePassword),
			login: apiWithBody(ApiDef_Account._v1.login),
			// login: (account: Account_Login['request']) => {
			//
			// 	toUpsert = this.cleanUp(toUpsert);
			// 	this.validateInternal(toUpsert);
			// 	return this.updatePending(toUpsert as DB_BaseObject, upsert(toUpsert), 'upsert');
			// },
			logout: apiWithQuery(ApiDef_Account._v1.logout),
			createToken: apiWithBody(ApiDef_Account._v1.createToken),
			setPassword: apiWithBody(ApiDef_Account._v1.setPassword),
			getSessions: apiWithQuery(ApiDef_Account._v1.getSessions),
			changeThumbnail: apiWithBody(ApiDef_Account._v1.changeThumbnail, this.onThumbnailChanged),
			loginSaml: apiWithQuery(ApiDef_SAML._v1.loginSaml, this.onLoginCompletedSAML),
			assertSAML: apiWithBody(ApiDef_SAML._v1.assertSAML),
			getPasswordAssertionConfig: apiWithQuery(ApiDef_Account._v1.getPasswordAssertionConfig, this.onPasswordAssertionConfig)
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

	// ######################## Logic ########################

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

	// ######################## API Callbacks ########################

	private onAccountCreated = async (response: UI_Account & DB_BaseObject) => {
		await this.onEntriesUpdated([response as DB_Account]);
	};

	private onThumbnailChanged = async (response: Account_ChangeThumbnail['response']) => {
		await this.onEntryUpdated(response.account, response.account);
	};

	private onLoginCompletedSAML = async (response: SAML_Login['response']) => {
		if (!response.loginUrl)
			return;

		window.location.href = response.loginUrl;
	};

	private onPasswordAssertionConfig = async (response: Account_GetPasswordAssertionConfig['response']) => {
		StorageKey_PasswordAssertionConfig.set(response.config);
	};
}

export const ModuleFE_Account = new ModuleFE_Account_Class();