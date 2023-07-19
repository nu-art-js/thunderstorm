import {ApiCallerEventType, ModuleFE_BaseApi} from '@nu-art/db-api-generator/frontend';
import {ProxyServiceAccount} from '../../shared/proxy-v2/types';
import {apiWithBody, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {DBDef_RemoteProxy} from '../../shared/proxy-v2/db-def';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiDef_ProxyServiceAccount, ApiStruct_ProxyServiceAccount} from '../../shared/proxy-v2';


export interface OnProxyServiceAccountUpdated {
	__OnProxyServiceAccountUpdated: (...params: ApiCallerEventType<ProxyServiceAccount>) => void;
}

export const dispatch_onProxyServiceAccountUpdated = new ThunderDispatcher<OnProxyServiceAccountUpdated, '__OnProxyServiceAccountUpdated'>('__OnProxyServiceAccountUpdated');

export class ModuleFE_v2_RemoteProxy_Class
	extends ModuleFE_BaseApi<ProxyServiceAccount> {
	readonly vv1: ApiDefCaller<ApiStruct_ProxyServiceAccount>['vv1'];

	constructor() {
		super(DBDef_RemoteProxy, dispatch_onProxyServiceAccountUpdated);
		this.vv1 = {
			createAccountToken: apiWithBody(ApiDef_ProxyServiceAccount.vv1.createAccountToken),
		};
	}
}

export const ModuleFE_v2_RemoteProxy = new ModuleFE_v2_RemoteProxy_Class();
