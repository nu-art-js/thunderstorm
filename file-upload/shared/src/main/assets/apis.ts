import {ApiDef, ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/api-types';
import {DB_Asset} from './types.js';
import {DB_BaseObject} from '@nu-art/ts-common';
import {UI_Asset} from './types.js';
import type {ResponseError} from '@nu-art/api-types';
import {FileStatus} from '../types.js';


export type SignedUrl = {
	signedUrl: string
}

export type TempSignedUrl = SignedUrl & {
	asset: DB_Asset
}

export type API_Assets = {
	getReadSignedUrl: BodyApi<SignedUrl, DB_BaseObject>;
};

export const ApiDef_Assets: ApiDefResolver<API_Assets> = {
	getReadSignedUrl: {method: HttpMethod.POST, path: 'v1/assets/get-read-signed-url'},
};

export type FileUploadResult = { status: FileStatus, asset: DB_Asset };
export type Api_UploadFile = BodyApi<FileUploadResult, any, ResponseError, HttpMethod.PUT>;
export const ApiDef_UploadFile: ApiDef<Api_UploadFile> = {method: HttpMethod.PUT, path: ''};

export type API_AssetUploader = {
	getUploadUrl: BodyApi<TempSignedUrl[], UI_Asset[]>;
	processAssetManually: QueryApi<void[], { feId?: string }>;
};

export const ApiDef_AssetUploader: ApiDefResolver<API_AssetUploader> = {
	getUploadUrl: {method: HttpMethod.POST, path: 'v1/upload/get-url'},
	processAssetManually: {method: HttpMethod.GET, path: 'v1/upload/process-asset-manually'},
};