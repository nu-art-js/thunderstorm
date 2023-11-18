import {addRoutes, createBodyServerApi, ModuleBE_BaseApiV3_Class} from '@nu-art/thunderstorm/backend';
import {ModuleBE_AssetsDB} from './ModuleBE_AssetsDB';
import {ApiDef_Assets, DBProto_Assets} from '../../shared';
import {ModuleBE_AssetsStorage} from './ModuleBE_AssetsStorage';
import {DB_BaseObject} from '@nu-art/ts-common';


export class ModuleBE_AssetsAPI_Class
	extends ModuleBE_BaseApiV3_Class<DBProto_Assets> {

	constructor() {
		super(ModuleBE_AssetsDB);
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_Assets.vv1.getReadSignedUrl, this.getReadSignedUrl)
		]);
	}

	private getReadSignedUrl = async (body: DB_BaseObject) => {
		const dbAsset = await ModuleBE_AssetsDB.query.uniqueAssert(body._id);
		return {
			signedUrl: (await (await ModuleBE_AssetsStorage.getFile(dbAsset)).getReadSignedUrl()).signedUrl
		};
	};
}

export const ModuleBE_AssetsAPI = new ModuleBE_AssetsAPI_Class();
