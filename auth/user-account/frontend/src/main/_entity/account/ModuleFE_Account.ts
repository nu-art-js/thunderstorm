import * as React from 'react';
import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallContext, ApiCaller, HttpClient} from '@nu-art/http-client';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {
	API_UserAccount,
	ApiDef_UserAccount,
	DatabaseDef_Account,
	DB_Account,
	DBDef_Accounts,
	HeaderKey_DeviceId,
	HeaderKey_TabId,
	UI_Account
} from '@nu-art/user-account-shared';
import {SessionKeyFE_Account, StorageKey_DeviceId, StorageKey_TabId} from './consts.js';
import {asArray, cloneObj, Exception, generateHex, KB} from '@nu-art/ts-common';
import {ModuleFE_Session, OnSessionUpdated} from '../session/ModuleFE_Session.js';
import {readFileAs_ArrayBuffer, ThunderDispatcher} from '@nu-art/thunder-core';
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

class ModuleFE_Account_Class
	extends ModuleFE_BaseApi<DatabaseDef_Account>
	implements OnLoginStatusUpdated, OnSessionUpdated {

	private status: LoggedStatus = LoggedStatus.LOGGED_OUT;

	__onLoginStatusUpdated() {
	}

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_Account>(DBDef_Accounts),
			crudApiDef: CrudApiDef<DatabaseDef_Account>(DBDef_Accounts.dbKey),
			dispatcher: (...args) => dispatch_onAccountsUpdated.dispatchAll(...args)
		});
	}

	@ApiCaller(ApiDef_UserAccount.refreshSession)
	async refreshSession(_params?: API_UserAccount['refreshSession']['Params']): Promise<API_UserAccount['refreshSession']['Response']> {
		return undefined as unknown as API_UserAccount['refreshSession']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.createAccount, {onComplete: (m: ModuleFE_Account_Class, ctx: ApiCallContext<API_UserAccount['createAccount']>) => m.onAccountCreated(ctx)})
	async createAccount(body: API_UserAccount['createAccount']['Body']): Promise<API_UserAccount['createAccount']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['createAccount']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.logout)
	async logout(_params?: API_UserAccount['logout']['Params']): Promise<API_UserAccount['logout']['Response']> {
		return undefined as unknown as API_UserAccount['logout']['Response'];
	}

	@ApiCaller(ApiDef_UserAccount.createToken)
	async createToken(body: API_UserAccount['createToken']['Body']): Promise<API_UserAccount['createToken']['Response']> {
		void body;
		return undefined as unknown as API_UserAccount['createToken']['Response'];
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

	@ApiCaller(ApiDef_UserAccount.deleteAccount, {onComplete: (m: ModuleFE_Account_Class, ctx: ApiCallContext<API_UserAccount['deleteAccount']>) => m.onAccountDeleted(ctx)})
	async deleteAccount(params: API_UserAccount['deleteAccount']['Params']): Promise<API_UserAccount['deleteAccount']['Response']> {
		void params;
		return undefined as unknown as API_UserAccount['deleteAccount']['Response'];
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


	private loginStatusPublished = false;

	getAccounts() {
		return this.cache.all().map(i => cloneObj(i)) as UI_Account[];
	}

	getLoggedStatus = () => this.status;

	isStatus = (status: LoggedStatus | LoggedStatus[]) => asArray(status).includes(this.status);

	__onSessionUpdated() {
		const nextStatus = this.deriveLoggedStatusFromSession();

		if (!this.loginStatusPublished) {
			this.loginStatusPublished = true;
			const prevStatus = this.status;
			this.status = nextStatus;
			this.logInfo(`Login status initialized: ${LoggedStatus[prevStatus]} => ${LoggedStatus[nextStatus]}`);
			dispatch_onLoginStatusChanged.dispatchAll();
			return;
		}

		this.setLoggedStatus(nextStatus);
	}

	private deriveLoggedStatusFromSession = () => {
		if (!ModuleFE_Session.hasSession())
			return LoggedStatus.LOGGED_OUT;

		if (!ModuleFE_Session.isSessionValid())
			return LoggedStatus.SESSION_TIMEOUT;

		return LoggedStatus.LOGGED_IN;
	};

	protected setLoggedStatus = (newStatus: LoggedStatus) => {
		if (this.status === newStatus)
			return;

		const pervStatus = this.status;
		this.status = newStatus;

		this.logInfo(`Login status changes: ${LoggedStatus[pervStatus]} => ${LoggedStatus[newStatus]}`);
		dispatch_onLoginStatusChanged.dispatchAll();
	};

	performLogout = async (url?: string) => {
		await this.logout({});
		dispatcher_onAuthRequired.dispatchModule();
		if (url)
			return window.location.href = url;
	};

	uploadAccountThumbnail = (e: React.MouseEvent, account: DB_Account) => {
		const input = document.createElement('input');
		input.type = 'file';
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

	public getCurrentlyLoggedAccount = () => {
		return SessionKeyFE_Account.get();
	};


	private onAccountCreated = async (ctx: ApiCallContext<API_UserAccount['createAccount']>) => {
		await this.onEntriesUpdated([ctx.response as DB_Account]);
	};

	private onThumbnailChanged = async (ctx: ApiCallContext<API_UserAccount['changeThumbnail']>) => {
		await this.onEntryUpdated(ctx.response.account, ctx.response.account);
	};

	private onAccountDeleted = async (ctx: ApiCallContext<API_UserAccount['deleteAccount']>) => {
		await this.onEntryDeleted(ctx.response.account);
	};
}

export const ModuleFE_Account = new ModuleFE_Account_Class();
