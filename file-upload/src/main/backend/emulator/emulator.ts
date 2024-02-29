import {Response} from 'express';
import {LocalRequest, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {DB_Asset, DBDef_Assets} from '../../shared';
import {lastElement} from '@nu-art/ts-common';
import {onRequest} from 'firebase-functions/v2/https';


export const firebaseStorageEmulatorProxy = {
	emulatorUpload: onRequest({maxInstances: 10, concurrency: 1,}, async (request: LocalRequest, response: Response) => {
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
		const pathToFile = request.query['path'];
		const file = await ModuleBE_Firebase.createAdminSession().getStorage().getFile(String(pathToFile));
		const asset = (await ModuleBE_Firebase.createAdminSession().getFirestoreV3().firestore
			.doc(`${DBDef_Assets.dbKey}/${lastElement(String(pathToFile).split('/'))}`).get()).data() as DB_Asset;

		file.createReadStream()
			.on('error', (err) => {
				console.error('Stream error:', err);
				response.status(500).send('Error downloading file');
			})
			.on('response', (fileResponse) => {
				console.log('response', fileResponse);
				Object.keys(fileResponse.headers).forEach(key => {
					response.set(key, fileResponse.headers[key]);
				});
				response.set('content-disposition', `attachment; filename=${asset.name}`);
				response.set('content-type', asset.mimeType || fileResponse.headers['content-type']);
			})
			.on('end', () => {
				console.log('File download completed.');
				response.end();
			})
			.pipe(response);
	})
};

