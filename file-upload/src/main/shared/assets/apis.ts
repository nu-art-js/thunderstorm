import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {DB_Asset} from './types1';
import {DB_BaseObject} from '@nu-art/ts-common';
import {UI_Asset} from './types';


export type SignedUrl = {
	signedUrl: string
}

export type TempSignedUrl = SignedUrl & {
	asset: DB_Asset
}

export type ApiStruct_Assets = {
	vv1: {
		getReadSignedUrl: BodyApi<SignedUrl, DB_BaseObject>,
	}
}

export const ApiDef_Assets: ApiDefResolver<ApiStruct_Assets> = {
	vv1: {
		getReadSignedUrl: {method: HttpMethod.POST, path: 'v1/assets/get-read-signed-url'},
	}
};

export type ApiStruct_AssetUploader = {
	vv1: {
		// uploadFile: BodyApi<FileUploadResult, any, any, ResponseError, HttpMethod.PUT>,
		getUploadUrl: BodyApi<TempSignedUrl[], UI_Asset[]>,
		processAssetManually: QueryApi<void[], { feId?: string }>,

	}
}

export const ApiDef_AssetUploader: ApiDefResolver<ApiStruct_AssetUploader> = {
	vv1: {
		// uploadFile: {method: HttpMethod.PUT, path: ''},
		getUploadUrl: {method: HttpMethod.POST, path: 'v1/upload/get-url'},
		processAssetManually: {method: HttpMethod.GET, path: 'v1/upload/process-asset-manually'},
	}
};