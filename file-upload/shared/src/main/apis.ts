import {ApiDefResolver, BodyApi, HttpMethod} from '@nu-art/api-types';
import {DB_Asset, PendingUpload, UploadRequest} from './types.js';
import {DB_BaseObject} from '@nu-art/ts-common';


export type SignedUrl = {
	signedUrl: string
};

export type API_FileUpload = {
	requestUpload: BodyApi<PendingUpload[], UploadRequest[]>;
	confirmUpload: BodyApi<DB_Asset, DB_BaseObject>;
	getReadSignedUrl: BodyApi<SignedUrl, DB_BaseObject>;
};

export const ApiDef_FileUpload: ApiDefResolver<API_FileUpload> = {
	requestUpload: {method: HttpMethod.POST, path: 'v1/file-upload/request'},
	confirmUpload: {method: HttpMethod.POST, path: 'v1/file-upload/confirm'},
	getReadSignedUrl: {method: HttpMethod.POST, path: 'v1/file-upload/read-url'},
};
