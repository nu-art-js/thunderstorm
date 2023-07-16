import {ApiCallerEventType, ModuleFE_BaseApi} from '@nu-art/db-api-generator/frontend';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';
import {ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DBDef_RemoteProxy} from '../../shared/proxy-v2/db-def';


export interface OnProxyServiceAccountUpdated {
	__OnProxyServiceAccountUpdated: (...params: ApiCallerEventType<ProxyServiceAccount>) => void;
}

export const dispatch_onProxyServiceAccountUpdated = new ThunderDispatcher<OnProxyServiceAccountUpdated, '__OnProxyServiceAccountUpdated'>('__OnProxyServiceAccountUpdated');

export class ModuleFE_RemoteProxyV2_Class
	extends ModuleFE_BaseApi<ProxyServiceAccount> {

	constructor() {
		super(DBDef_RemoteProxy, dispatch_onProxyServiceAccountUpdated);
	}
}

export const ModuleFE_RemoteProxyV2 = new ModuleFE_RemoteProxyV2_Class();
