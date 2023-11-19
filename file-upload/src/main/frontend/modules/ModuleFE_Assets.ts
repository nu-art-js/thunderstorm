import {ModuleFE_v3_BaseApi, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {currentTimeMillis} from '@nu-art/ts-common';
import {DB_Asset, DBDef_Assets, DBProto_Assets} from '../../shared';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


export interface OnAssetsUpdated {
	__onAssetsUpdated: (...params: ApiCallerEventType<DB_Asset>) => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

export class ModuleFE_Assets_Class
	extends ModuleFE_v3_BaseApi<DBProto_Assets> {

	constructor() {
		super(DBDef_Assets, dispatch_onAssetsListChanged);
	}

	async resolveValidSignedUrl(assetId: string) {
		const asset = this.cache.unique(assetId);
		const signedUrl = (asset?.signedUrl?.validUntil || 0) > currentTimeMillis() ? asset?.signedUrl : undefined;
		if (signedUrl)
			return signedUrl.url;

		return (await ModuleFE_Assets.v1.queryUnique(assetId).executeSync()).signedUrl!.url;
	}
}

export const ModuleFE_Assets = new ModuleFE_Assets_Class();
