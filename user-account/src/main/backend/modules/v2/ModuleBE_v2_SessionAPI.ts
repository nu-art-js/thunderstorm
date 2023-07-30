// import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
// import {ModuleBE_BaseApiV2_Class} from '@nu-art/db-api-generator/backend/ModuleBE_BaseApiV2';
// import {ModuleBE_v2_SessionDB} from './ModuleBE_v2_SessionDB';
// import {ApiDef_Session, DB_Session_V2} from '../../../shared/v2';
//
//
// class ModuleBE_v2_SessionAPI_Class
// 	extends ModuleBE_BaseApiV2_Class<DB_Session_V2> {
//
// 	constructor() {
// 		super(ModuleBE_v2_SessionDB);
// 		addRoutes([
// 			createBodyServerApi(ApiDef_Session.vv1.createAccountToken, ModuleBE_v2_SessionDB.createAccountToken),
// 		]);
// 	}
// }
//
// export const ModuleBE_v2_SessionAPI = new ModuleBE_v2_SessionAPI_Class();