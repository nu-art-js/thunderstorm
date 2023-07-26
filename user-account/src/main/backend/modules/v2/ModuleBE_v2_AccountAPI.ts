import {addRoutes, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {ModuleBE_BaseApiV2_Class} from '@nu-art/db-api-generator/backend/ModuleBE_BaseApiV2';
import {ModuleBE_v2_AccountDB} from './ModuleBE_v2_AccountDB';
import {ApiDefBE_Account, DB_Account_V2} from '../../../shared/v2';


class ModuleBE_v2_AccountAPI_Class
	extends ModuleBE_BaseApiV2_Class<DB_Account_V2> {

	constructor() {
		super(ModuleBE_v2_AccountDB);
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDefBE_Account.vv1.registerAccount, ModuleBE_v2_AccountDB.account.register),
			createBodyServerApi(ApiDefBE_Account.vv1.changePassword, ModuleBE_v2_AccountDB.changePassword),
		]);
	}
}

export const ModuleBE_v2_AccountAPI = new ModuleBE_v2_AccountAPI_Class();
