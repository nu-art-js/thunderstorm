// import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
// import {ApiDef_ProxyServiceAccount, ProxyServiceAccount} from '../../shared/proxy-v2';
// import {ModuleBE_v2_RemoteProxyDB} from './ModuleBE_v2_RemoteProxyDB';
// import {ModuleBE_BaseApiV2_Class} from '@nu-art/db-api-generator/backend/ModuleBE_BaseApiV2';
//
//
// class ModuleBE_v2_RemoteProxyAPI_Class
// 	extends ModuleBE_BaseApiV2_Class<ProxyServiceAccount> {
//
// 	constructor() {
// 		super(ModuleBE_v2_RemoteProxyDB);
// 	}
//
// 	init() {
// 		super.init();
// 		addRoutes([
// 			createBodyServerApi(ApiDef_ProxyServiceAccount.vv1.createAccountToken, ModuleBE_v2_RemoteProxyDB.createAccountToken),
// 		]);
// 	}
// }
//
// export const ModuleBE_v2_RemoteProxyAPI = new ModuleBE_v2_RemoteProxyAPI_Class();