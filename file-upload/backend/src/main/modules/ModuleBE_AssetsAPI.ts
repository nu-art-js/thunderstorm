import {Module} from '@nu-art/ts-common';
import {ApiHandler} from '@nu-art/http-server';
import {ModuleBE_AssetsDB} from './ModuleBE_AssetsDB.js';
import {ModuleBE_AssetsStorage} from './ModuleBE_AssetsStorage.js';
import {API_Assets, ApiDef_Assets} from '@nu-art/file-upload-shared';


export class ModuleBE_AssetsAPI_Class
	extends Module {

	constructor() {
		super('AssetsAPI');
	}

	@ApiHandler(ApiDef_Assets.getReadSignedUrl)
	async getReadSignedUrl(body: API_Assets['getReadSignedUrl']['Body']): Promise<API_Assets['getReadSignedUrl']['Response']> {
		const dbAsset = await ModuleBE_AssetsDB.query.uniqueAssert(body._id as any);
		return {
			signedUrl: (await (await ModuleBE_AssetsStorage.getFile(dbAsset)).getReadSignedUrl()).signedUrl
		};
	}
}

export const ModuleBE_AssetsAPI = new ModuleBE_AssetsAPI_Class();
