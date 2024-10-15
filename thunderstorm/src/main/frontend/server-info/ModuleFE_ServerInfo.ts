import {compareVersions, Module, RuntimeVersion} from '@nu-art/ts-common';
import {apiWithQuery} from '../core/typed-api';
import {ApiDef_ServerInfo, ApiStruct_ServerInfo, Response_ServerInfo} from '../../shared/server-info/api';
import {ApiCallerRouter, ApiDefCaller, Default_ServerInfoNodePath, QueryApi, ServerInfoFirebaseState} from '../../shared';
import {ModuleFE_FirebaseListener, RefListenerFE} from '@nu-art/firebase/frontend/ModuleFE_FirebaseListener/ModuleFE_FirebaseListener';
import {DataSnapshot} from 'firebase/database';
import {ThunderDispatcher} from '../core/thunder-dispatcher';
import {StorageKey} from '../modules/ModuleFE_LocalStorage';

export const StorageKey_ServerVersion = new StorageKey<string>('server-version');

export interface OnServerInfoUpdatedListener {
	__onServerInfoUpdated: () => void;
}

const dispatch_OnServerInfoUpdated = new ThunderDispatcher<OnServerInfoUpdatedListener, '__onServerInfoUpdated'>('__onServerInfoUpdated');


class ModuleFE_ServerInfo_Class
	extends Module
	implements ApiDefCaller<ApiStruct_ServerInfo> {

	v1: ApiCallerRouter<{ getServerInfo: QueryApi<Response_ServerInfo>; updateServerInfo: QueryApi<void>; }>;
	private serverInfoFirebaseListener?: RefListenerFE<ServerInfoFirebaseState>;

	constructor() {
		super();
		this.v1 = {
			getServerInfo: apiWithQuery(ApiDef_ServerInfo.v1.getServerInfo),

			// @ts-ignore // to be used only by Jenkins
			updateServerInfo: undefined,
		};
	}

	public startListening() {
		this.serverInfoFirebaseListener = ModuleFE_FirebaseListener
			.createListener(Default_ServerInfoNodePath)
			.startListening(this.onServerInfoDataChanged);
	}

	public stopListening() {
		this.logDebug(`Stop listening on ${Default_ServerInfoNodePath}`);
		this.serverInfoFirebaseListener?.stopListening();
		this.serverInfoFirebaseListener = undefined;
	}

	private onServerInfoDataChanged = async (snapshot: DataSnapshot) => {
		const rtdbServerInfoData = snapshot.val() as ServerInfoFirebaseState | undefined;
		if (!rtdbServerInfoData) {
			this.logInfo(`Did not receive any ServerInfo via firebase listener`);
			return;
		}

		StorageKey_ServerVersion.set(rtdbServerInfoData.version);
		dispatch_OnServerInfoUpdated.dispatchAll();
	};

	public Version = {
		getAppVersion: () => {
			let version = RuntimeVersion();
			if (!version) {
				this.logWarning(`Couldn't find a version-app.json file to get the code version from.`);
				version = '0.0.0';
			}
			this.logInfo(`Code version: ${version}`);
			return version;
		},
		getLatestVersion: () => {
			const version = StorageKey_ServerVersion.get() || '0.0.0';
			this.logInfo(`Server version: ${version}`);
			return version;
		},
		shouldUpdateVersion: (): boolean => {
			const lastVersion = this.Version.getLatestVersion();
			const codeVersion = this.Version.getAppVersion();
			if (compareVersions(codeVersion, lastVersion) !== 1)
				return false;

			return true;
		}
	};

}

export const ModuleFE_ServerInfo = new ModuleFE_ServerInfo_Class();