import {apiWithBody, ModuleFE_BaseApi, ThunderDispatcher} from '@nu-art/thunderstorm/frontend';
import {currentTimeMillis} from '@nu-art/ts-common';
import {ApiDef_Assets, ApiStruct_Assets, DBDef_Assets, DBProto_Assets} from '../../shared';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {ApiCallerEventType} from '@nu-art/thunderstorm/frontend/core/db-api-gen/types';


export interface OnAssetsUpdated {
	__onAssetsUpdated: (...params: ApiCallerEventType<DBProto_Assets>) => void;
}

export const dispatch_onAssetsListChanged = new ThunderDispatcher<OnAssetsUpdated, '__onAssetsUpdated'>('__onAssetsUpdated');

export class ModuleFE_Assets_Class
	extends ModuleFE_BaseApi<DBProto_Assets> {

	readonly vv1: ApiDefCaller<ApiStruct_Assets>['vv1'];

	constructor() {
		super(DBDef_Assets, dispatch_onAssetsListChanged);
		this.vv1 = {
			getReadSignedUrl: apiWithBody(ApiDef_Assets.vv1.getReadSignedUrl),
		};
	}

	async resolveValidSignedUrl(assetId: string) {
		const asset = this.cache.unique(assetId);
		const signedUrl = (asset?.signedUrl?.validUntil || 0) > currentTimeMillis() ? asset?.signedUrl : undefined;
		if (signedUrl)
			return signedUrl.url;

		const request = this.vv1.getReadSignedUrl({_id: assetId});
		const response = await request.executeSync();
		return response.signedUrl;
	}
}

export const ModuleFE_Assets = new ModuleFE_Assets_Class();
