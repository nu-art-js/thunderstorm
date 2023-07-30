import {ApiDef, HttpMethod, QueryApi, Request_BackupId, Response_BackupDocsV2} from '@nu-art/thunderstorm';
import {addRoutes, AxiosHttpModule, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {_keys, ApiException, BadImplementationException, Module, TypedMap, UniqueId} from '@nu-art/ts-common';
import {ApiDef_SyncEnvV2, Request_FetchFirebaseBackup, Request_FetchFromEnvV2, Request_GetMetadata} from '../shared';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {ModuleBE_v2_Backup} from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_Backup';


type Config = {
	urlMap: TypedMap<string>
	fetchBackupDocsSecretsMap: TypedMap<string>,
	maxBatch: number
}

class ModuleBE_v2_SyncEnv_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig({maxBatch: 500});
	}

	init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_SyncEnvV2.vv1.fetchFromEnv, this.fetchFromEnv),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.createBackup, this.createBackup),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.fetchBackupMetadata, this.fetchBackupMetadata),
			createQueryServerApi(ApiDef_SyncEnvV2.vv1.fetchFirebaseBackup, this.fetchFirebaseBackup),
		]);
	}

	fetchBackupMetadata = async (queryParams: Request_GetMetadata) => {
		const backupInfo = await this.getBackupInfo(queryParams);

		if (!backupInfo)
			throw new ApiException(404, 'backup file not found');

		if (!backupInfo.metadata)
			throw new ApiException(404, 'No metadata found on this backup');

		return backupInfo.metadata;
	};

	private async getBackupInfo(queryParams: { env: string, backupId: UniqueId }) {
		const {backupId, env} = queryParams;
		if (!env)
			throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

		const url: string = `${this.config.urlMap[env]}/v1/fetch-backup-docs-v2`;
		const outputDef: ApiDef<QueryApi<any>> = {method: HttpMethod.GET, path: '', fullUrl: url};

		const requestBody: Request_BackupId = {backupId};

		try {

			const response: Response_BackupDocsV2 = await AxiosHttpModule
				.createRequest(outputDef)
				.setUrlParams(requestBody)
				.addHeader('x-secret', this.config.fetchBackupDocsSecretsMap[env])
				.addHeader('x-proxy', 'fetch-env')
				.executeSync();

			const backupInfo = response.backupInfo;

			const wrongBackupIdDescriptor = backupInfo?._id !== backupId;

			if (wrongBackupIdDescriptor)
				throw new BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${backupId} received id: ${backupInfo?._id}`);

			return backupInfo;
		} catch (err: any) {
			throw new ApiException(500, err);
		}
	}

	createBackup = async () => {
		return ModuleBE_v2_Backup.initiateBackup(true);
	};

	fetchFromEnv = async (body: Request_FetchFromEnvV2) => {
		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);


		const backupInfo = await this.getBackupInfo(body);

		this.logInfo(backupInfo)

		if (!backupInfo.backupFilePath)
			throw new ApiException(404, 'Backup file path not found');

		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const storage = firebaseSessionAdmin.getStorage();
		const bucket = await storage.getMainBucket();
		const backupDoc = await bucket.getFile(backupInfo.backupFilePath);

		const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;

		let resultsArray: { ref: FirebaseFirestore.DocumentReference, data: any }[] = [];
		const readBatchSize = this.config.maxBatch * 4;
		let totalReadCount = 0;

		const dataCallback = (row: any, index: number) => {
			if (index < totalReadCount || resultsArray.length === readBatchSize)
				return;

			_keys(row).map(key => {
				row[(key as string).trim()] = (row[key] as string).trim();
			});

			if (!body.selectedModules.includes(row.collectionName))
				return;

			const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
			const data = JSON.parse(row.document);

			resultsArray.push({ref: documentRef, data: data});
		};

		do {
			resultsArray = [];
			await CSVModule.forEachCsvRowFromStreamSync(backupDoc.file.createReadStream(), dataCallback);

			for (let i = 0; i < resultsArray.length; i += this.config.maxBatch) {
				const writeBatch = firestore.batch();
				const batch = resultsArray.slice(i, i + this.config.maxBatch);

				batch.map(item => writeBatch.set(item.ref, item.data));

				await writeBatch.commit();
			}

			totalReadCount += resultsArray.length;
			this.logInfo(`results Array: ${resultsArray.length}`);
			this.logInfo(`readBatchSize: ${readBatchSize}`);
			this.logInfo(`totalReadCount: ${totalReadCount}`);
		} while (resultsArray.length > 0 && resultsArray.length % readBatchSize === 0);
	};


	fetchFirebaseBackup = async (queryParams: Request_FetchFirebaseBackup) => {
		try {
			this.logDebug('Getting the firebase backup file');
			const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
			const backupInfo = await this.getBackupInfo(queryParams);
			const bucket = await firebaseSessionAdmin.getStorage().getMainBucket();
			const database = firebaseSessionAdmin.getDatabase();

			this.logDebug('Reading the file from storage');
			const firebaseBackupFile = await (await bucket.getFile(backupInfo.firebaseFilePath)).read();


			this.logDebug('Setting the file in firebase database');
			await database.set('/', JSON.parse(firebaseBackupFile.toString()));
		} catch (err: any) {
			throw new ApiException(500, err);
		}
	};
}

export const ModuleBE_v2_SyncEnv = new ModuleBE_v2_SyncEnv_Class();