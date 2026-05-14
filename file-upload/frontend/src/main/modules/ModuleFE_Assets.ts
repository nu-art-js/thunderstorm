import {buildConfigFromDBDef, ModuleFE_BaseApi} from '@nu-art/db-api-frontend';
import {ApiCallerEventType, CrudApiDef} from '@nu-art/db-api-shared';
import {currentTimeMillis} from '@nu-art/ts-common';
import {ThunderDispatcher} from '@nu-art/thunder-core';
import {DatabaseDef_Assets, DBDef_Assets} from '@nu-art/file-upload-shared';
import {ModuleFE_FileUpload} from './ModuleFE_FileUpload.js';


export interface OnAssetsUpdated {
	__onAssetsUpdated: (...params: ApiCallerEventType<DatabaseDef_Assets['dbType']>) => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

export class ModuleFE_Assets_Class
	extends ModuleFE_BaseApi<DatabaseDef_Assets> {

	constructor() {
		super({
			config: buildConfigFromDBDef<DatabaseDef_Assets>(DBDef_Assets),
			crudApiDef: CrudApiDef<DatabaseDef_Assets>(DBDef_Assets.dbKey),
			dispatcher: (...args) => dispatch_onAssetsListChanged.dispatchAll(...args),
		});
	}

	async resolveValidSignedUrl(assetId: string): Promise<string> {
		const id = assetId as DatabaseDef_Assets['dbType']['_id'];
		const asset = this.cache.unique(id);
		const signedUrl = (asset?.signedUrl?.validUntil || 0) > currentTimeMillis() ? asset?.signedUrl : undefined;
		if (signedUrl)
			return signedUrl.url;

		return ModuleFE_FileUpload.getReadSignedUrl(assetId);
	}
}

export const ModuleFE_Assets = new ModuleFE_Assets_Class();
