import {BaseUploaderFile, FileUploadResult, TempSecureUrl} from './types';
import {HttpMethod} from '@nu-art/testelot';
import {ApiDefResolver, BodyApi, QueryApi} from '@nu-art/thunderstorm';


export type ApiStruct_AssetUploader = {
	vv1: {
		uploadFile: BodyApi<FileUploadResult, any, any, HttpMethod.PUT>,
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