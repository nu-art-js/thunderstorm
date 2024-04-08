import * as React from 'react';
import {
	apiWithBody,
	apiWithQuery,
	getQueryParameter,
	ModuleFE_BrowserHistory,
	ModuleFE_v3_BaseApi,
	ModuleFE_XHR,
	OnStorageKeyChangedListener,
	readFileContent,
	ThunderDispatcher
} from '@nu-art/thunderstorm/frontend';
import {ApiDefCaller, BaseHttpRequest} from '@nu-art/thunderstorm';
import {ungzip} from 'pako';
import {cloneObj, composeUrl, currentTimeMillis, DB_BaseObject, Exception, exists, generateHex, KB, TS_Object} from '@nu-art/ts-common';
import {OnAuthRequiredListener} from '@nu-art/thunderstorm/shared/no-auth-listener';
import {Account_ChangeThumbnail, ApiDef_SAML, ApiStruct_SAML, HeaderKey_SessionId, HeaderKey_TabId, QueryParam_SessionId, SAML_Login,} from '../../../shared';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';
import {ApiDef_Account, ApiStruct_Account, DB_Account, DBDef_Accounts, DBProto_Account, Response_Auth, UI_Account} from '../shared';
import {StorageKey_DeviceId, StorageKey_SessionId, StorageKey_SessionTimeoutTimestamp, StorageKey_TabId} from './consts';


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

type ApiDefCaller_Account = ApiDefCaller<{ _v1: ApiStruct_Account['_v1'] & ApiStruct_SAML['_v1'] }>;

class ModuleFE_Account_Class
	extends ModuleFE_v3_BaseApi<DBProto_Account>
	implements ApiDefCaller_Account, OnAuthRequiredListener, OnStorageKeyChangedListener {

	// @ts-ignore
	private sessionData!: TS_Object;
	readonly _v1: ApiDefCaller_Account['_v1'];
	private status: LoggedStatus = LoggedStatus.VALIDATING;
	accountId!: string;

	constructor() {
		super(DBDef_Accounts, dispatch_onAccountsUpdated);

		this._v1 = {
			refreshSession: apiWithQuery(ApiDef_Account._v1.refreshSession),
			registerAccount: apiWithBody(ApiDef_Account._v1.registerAccount, this.setLoginInfo),
			createAccount: apiWithBody(ApiDef_Account._v1.createAccount, this.onAccountCreated),
			changePassword: apiWithBody(ApiDef_Account._v1.changePassword, this.setLoginInfo),
			login: apiWithBody(ApiDef_Account._v1.login, this.setLoginInfo),
			logout: apiWithQuery(ApiDef_Account._v1.logout),
			createToken: apiWithBody(ApiDef_Account._v1.createToken),
			setPassword: apiWithBody(ApiDef_Account._v1.setPassword, this.setLoginInfo),
			getSessions: apiWithQuery(ApiDef_Account._v1.getSessions),
			changeThumbnail: apiWithBody(ApiDef_Account._v1.changeThumbnail, this.onThumbnailChanged),
			loginSaml: apiWithQuery(ApiDef_SAML._v1.loginSaml, this.onLoginCompletedSAML),
			assertSAML: apiWithBody(ApiDef_SAML._v1.assertSAML),
		};
	}

	__onAuthRequiredListener(request: BaseHttpRequest<any>) {
		StorageKey_SessionId.delete();
		StorageKey_SessionTimeoutTimestamp.set(currentTimeMillis());
		return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);
	}

	getAccounts() {
		return this.cache.all().map(i => cloneObj(i)) as UI_Account[];
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatus) => this.status === status;

	__onStorageKeyEvent(event: StorageEvent) {
		if (event.key === StorageKey_SessionId.key) {
			const sessionData = StorageKey_SessionId.get();
			if (sessionData)
				this.sessionData = this.decode(sessionData);
			else
				this.sessionData = {};
		}
	}

	private onAccountCreated = async (response: UI_Account & DB_BaseObject) => {
		await this.onEntriesUpdated([response as DB_Account]);
	};

	protected init(): void {
		super.init();
		if (!exists(StorageKey_DeviceId.get())) {
			const deviceId = generateHex(32);
			console.log(`Defining new device Id: ${deviceId}`);
			StorageKey_DeviceId.set(deviceId);
		}
		if (!exists(StorageKey_TabId.get())) {
			const tabId = generateHex(32);
			console.log(`Defining new tab Id: ${tabId}`);
			StorageKey_TabId.set(tabId);
		}

		ModuleFE_XHR.addDefaultHeader(HeaderKey_SessionId, () => StorageKey_SessionId.get());
		ModuleFE_XHR.addDefaultHeader(HeaderKey_TabId, () => StorageKey_TabId.get());
		ModuleFE_XHR.setDefaultOnComplete(async (__, _, request) => {
			if (!request.getUrl().startsWith(ModuleFE_XHR.getOrigin()))
				return;

			const responseHeader = request.getResponseHeader(HeaderKey_SessionId);
			if (!responseHeader)
				return;

			const sessionId = typeof responseHeader === 'string' ? responseHeader : responseHeader[0];
			StorageKey_SessionId.set(sessionId);
			this.sessionData = this.decode(sessionId);
			this.processSessionStatus(sessionId);
		});

		const sessionId = getQueryParameter(QueryParam_SessionId);
		if (sessionId) {
			StorageKey_SessionId.set(String(sessionId));
			ModuleFE_BrowserHistory.removeQueryParam(QueryParam_SessionId);
		}

		const _sessionId = StorageKey_SessionId.get();
		if (_sessionId)
			return this.processSessionStatus(_sessionId);

		this.logDebug('login out user.... ');
		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
	}

	private processSessionStatus(sessionId: string) {
		const now = currentTimeMillis();
		try {
			const sessionData = this.decode(sessionId);
			if (!exists(sessionData.session.expiration) || now > sessionData.session.expiration)
				return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);

			this.accountId = sessionData.account._id;
			this.sessionData = sessionData;
			return this.setLoggedStatus(LoggedStatus.LOGGED_IN);
		} catch (e: any) {
			return this.setLoggedStatus(LoggedStatus.SESSION_TIMEOUT);
		}
	}

	protected setLoggedStatus = (newStatus: LoggedStatus) => {
		if (this.status === newStatus)
			return;

		const pervStatus = this.status;
		this.status = newStatus;
		if (newStatus === LoggedStatus.LOGGED_IN || newStatus === LoggedStatus.LOGGED_OUT)
			StorageKey_SessionTimeoutTimestamp.delete();

		this.logInfo(`Login status changes: ${LoggedStatus[pervStatus]} => ${LoggedStatus[newStatus]}`);
		dispatch_onLoginStatusChanged.dispatchUI();
		dispatch_onLoginStatusChanged.dispatchModule();
	};

	private setLoginInfo = async (response: Response_Auth, body: any, request: BaseHttpRequest<any>) => {
		this.accountId = response._id;
		this.setLoggedStatus(LoggedStatus.LOGGED_IN);
	};

	private onLoginCompletedSAML = async (response: SAML_Login['response']) => {
		if (!response.loginUrl)
			return;

		window.location.href = response.loginUrl;
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

	public getSessionId = (): string => {
		return StorageKey_SessionId.get('');
	};

	private decode(sessionData: string) {
		if (!sessionData.length)
			return;

		return JSON.parse(new TextDecoder('utf8').decode(ungzip(Uint8Array.from(atob(sessionData), c => c.charCodeAt(0)))));
	}

	logout = async (url?: string) => {
		await this._v1.logout({}).executeSync();
		StorageKey_SessionId.delete();
		if (url)
			return window.location.href = url;

		this.setLoggedStatus(LoggedStatus.LOGGED_OUT);
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

	private onThumbnailChanged = async (response: Account_ChangeThumbnail['response']) => {
		await this.onEntryUpdated(response.account, response.account);
	};
}


export const ModuleFE_Account = new ModuleFE_Account_Class();