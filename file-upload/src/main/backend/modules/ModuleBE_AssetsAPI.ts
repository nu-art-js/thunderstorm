import {addRoutes, createBodyServerApi, ModuleBE_BaseApiV2_Class} from '@nu-art/thunderstorm/backend';
import {ModuleBE_AssetsDB} from './ModuleBE_AssetsDB';
import {ApiDef_Assets, DB_Asset, Request_GetReadSecuredUrl} from '../../shared';

export class ModuleBE_AssetsAPI_Class
	extends ModuleBE_BaseApiV2_Class<DB_Asset> {

	constructor() {
		super(ModuleBE_AssetsDB);
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_Assets.vv1.fetchSpecificFile, this.fetchSpecificFile)
		]);
	}

	private fetchSpecificFile = async (body: Request_GetReadSecuredUrl) => {
		return ModuleBE_AssetsDB.fetchSpecificFile(body);
	};
}

export const ModuleBE_AssetsAPI = new ModuleBE_AssetsAPI_Class();
