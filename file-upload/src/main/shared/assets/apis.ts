import {ApiDef, ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@thunder-storm/core';
import {DB_Asset} from './types1';
import {DB_BaseObject} from '@thunder-storm/common';
import {UI_Asset} from './types';
import {ResponseError} from '@thunder-storm/common/core/exceptions/types';
import {FileStatus} from '../types';


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

export type FileUploadResult = { status: FileStatus, asset: DB_Asset };
export type Api_UploadFile = BodyApi<FileUploadResult, any, any, ResponseError, HttpMethod.PUT>;
export const ApiDef_UploadFile: ApiDef<Api_UploadFile> = {method: HttpMethod.PUT, path: ''};

export type ApiStruct_AssetUploader = {
	vv1: {
		getUploadUrl: BodyApi<TempSignedUrl[], UI_Asset[]>,
		processAssetManually: QueryApi<void[], { feId?: string }>,

	}
}

export const ApiDef_AssetUploader: ApiDefResolver<ApiStruct_AssetUploader> = {
	vv1: {
		getUploadUrl: {method: HttpMethod.POST, path: 'v1/upload/get-url'},
		processAssetManually: {method: HttpMethod.GET, path: 'v1/upload/process-asset-manually'},
	}
};