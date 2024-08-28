import {Response} from 'express';
import {onRequest} from 'firebase-functions/v2/https';
import {LocalRequest} from '../functions/firebase-function';
import {ModuleBE_Firebase} from '../ModuleBE_Firebase';
import {HttpCodes} from '@thunder-storm/common/core/exceptions/http-codes';


export const firebaseStorageEmulatorProxy = {
	emulatorUpload: onRequest({maxInstances: 10, concurrency: 1,}, async (request: LocalRequest, response: Response) => {
		if (request.method.toLowerCase() !== 'put')
			response.send('method not supported').end(HttpCodes._4XX.METHOD_NOT_ALLOWED.code);

		const pathToFile = request.query['path'];
		const file = await ModuleBE_Firebase.createAdminSession().getStorage().getFile(String(pathToFile));
		const writable = file.createWriteStream({gzip: true});
		request.pipe(writable)
			.on('error', (err) => {
				console.error('Stream error:', err);
				response.status(500).send('Error uploading file');
			})
			.on('finish', () => {
				response.status(200).send('File uploaded successfully');
			});
	}),
	emulatorDownload: onRequest({maxInstances: 10, concurrency: 1,}, async (request: LocalRequest, response: Response) => {
		if (request.method.toLowerCase() !== 'get')
			response.send('method not supported').end(HttpCodes._4XX.METHOD_NOT_ALLOWED.code);
		const pathToFile = request.query['path'];
		const contentType = request.query['content-type'];
		const fileName = request.query['file-name'];
		const file = await ModuleBE_Firebase.createAdminSession().getStorage().getFile(String(pathToFile));

		file.createReadStream({decompress: false})
			.on('error', (err) => {
				console.error('Stream error:', err);
				response.status(500).send('Error downloading file');
			})
			.on('response', (fileResponse) => {
				console.log('response', fileResponse);
				Object.keys(fileResponse.headers).forEach(key => {
					response.set(key, fileResponse.headers[key]);
				});
				response.set('content-disposition', `attachment; filename=${fileName}`);
				response.set('content-type', contentType || fileResponse.headers['content-type']);
			})
			.on('end', () => {
				console.log('File download completed.');
				response.end();
			})
			.pipe(response);
	})
};

