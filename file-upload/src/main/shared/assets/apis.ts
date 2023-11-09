import {BaseUploaderFile, FileUploadResult, Request_GetReadSecuredUrl, SecureUrl, TempSecureUrl} from './types';
import {ApiDefResolver, BodyApi, HttpMethod, QueryApi} from '@nu-art/thunderstorm';
import {ResponseError} from '@nu-art/ts-common/core/exceptions/types';


export type ApiStruct_Assets = {
	vv1: {
		fetchSpecificFile: BodyApi<SecureUrl, Request_GetReadSecuredUrl>,

	}
}

export const ApiDef_Assets: ApiDefResolver<ApiStruct_Assets> = {
	vv1: {
		fetchSpecificFile: {method: HttpMethod.POST, path: 'v1/assets/get-read-secured-url'},
	}
};

export type ApiStruct_AssetUploader = {
	vv1: {
		uploadFile: BodyApi<FileUploadResult, any, any, ResponseError, HttpMethod.PUT>,
		getUploadUrl: BodyApi<TempSecureUrl[], BaseUploaderFile[]>,
		processAssetManually: QueryApi<void[], { feId?: string }>,

	}
}

export const ApiDef_AssetUploader: ApiDefResolver<ApiStruct_AssetUploader> = {
	vv1: {
		uploadFile: {method: HttpMethod.PUT, path: ''},
		getUploadUrl: {method: HttpMethod.POST, path: 'v1/upload/get-url'},
		processAssetManually: {method: HttpMethod.GET, path: 'v1/upload/process-asset-manually'},
	}
};