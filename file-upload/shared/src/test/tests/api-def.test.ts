import {HttpMethod} from '@nu-art/api-types';
import {ApiDef_FileUpload} from '../../main/apis.js';


describe('ApiDef_FileUpload', () => {
	it('requestUpload is POST to v1/file-upload/request', () => {
		if (ApiDef_FileUpload.requestUpload.method !== HttpMethod.POST)
			throw new Error(`Expected POST, got ${ApiDef_FileUpload.requestUpload.method}`);

		if (ApiDef_FileUpload.requestUpload.path !== 'v1/file-upload/request')
			throw new Error(`Expected path "v1/file-upload/request", got "${ApiDef_FileUpload.requestUpload.path}"`);
	});

	it('confirmUpload is POST to v1/file-upload/confirm', () => {
		if (ApiDef_FileUpload.confirmUpload.method !== HttpMethod.POST)
			throw new Error(`Expected POST, got ${ApiDef_FileUpload.confirmUpload.method}`);

		if (ApiDef_FileUpload.confirmUpload.path !== 'v1/file-upload/confirm')
			throw new Error(`Expected path "v1/file-upload/confirm", got "${ApiDef_FileUpload.confirmUpload.path}"`);
	});

	it('getReadSignedUrl is POST to v1/file-upload/read-url', () => {
		if (ApiDef_FileUpload.getReadSignedUrl.method !== HttpMethod.POST)
			throw new Error(`Expected POST, got ${ApiDef_FileUpload.getReadSignedUrl.method}`);

		if (ApiDef_FileUpload.getReadSignedUrl.path !== 'v1/file-upload/read-url')
			throw new Error(`Expected path "v1/file-upload/read-url", got "${ApiDef_FileUpload.getReadSignedUrl.path}"`);
	});

	it('All three endpoints are defined', () => {
		const endpoints = ['requestUpload', 'confirmUpload', 'getReadSignedUrl'] as const;
		for (const ep of endpoints) {
			if (!ApiDef_FileUpload[ep])
				throw new Error(`Missing endpoint definition: ${ep}`);

			if (!ApiDef_FileUpload[ep].method)
				throw new Error(`Endpoint ${ep} missing method`);

			if (!ApiDef_FileUpload[ep].path)
				throw new Error(`Endpoint ${ep} missing path`);
		}
	});
});
