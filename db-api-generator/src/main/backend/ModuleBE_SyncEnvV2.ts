import {ApiDef, HttpMethod, QueryApi, Request_BackupId, Response_BackupDocsV2} from '@nu-art/thunderstorm';
import {addRoutes, AxiosHttpModule, createBodyServerApi} from '@nu-art/thunderstorm/backend';
import {_keys, BadImplementationException, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDef_SyncEnvV2, Request_FetchFromEnv} from '../shared';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';


type Config = {
	urlMap: TypedMap<string>
	fetchBackupDocsSecretsMap: TypedMap<string>
}

class ModuleBE_SyncEnvV2_Class
	extends Module<Config> {

	constructor() {
		super();
		addRoutes([createBodyServerApi(ApiDef_SyncEnvV2.vv1.fetchFromEnv, this.fetchFromEnv)]);
	}

	// private formatCsvToMapper = (csvContent: CsvRow[]) => {
	//
	// };

	fetchFromEnv = async (body: Request_FetchFromEnv) => {
		this.logInfoBold('Received API call Fetch From Env!');
		this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);
		if (!body.env)
			throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

		if (body.onlyModules && body.excludedModules)
			this.logWarningBold('excludedModules config exists alongside onlyModules, so excludedModules are ignored.');

		this.logInfo('\n\n\n\n\noyoyoyoyo');
		this.logInfo(this.config.urlMap);
		this.logInfo('\n\n\n\n\n');
		const url: string = `${this.config.urlMap[body.env]}/v1/fetch-backup-docs-v2`;
		const outputDef: ApiDef<QueryApi<any>> = {method: HttpMethod.GET, path: '', fullUrl: url};

		const requestBody: Request_BackupId = {backupId: body.backupId};

		const response: Response_BackupDocsV2 = await AxiosHttpModule
			.createRequest(outputDef)
			.setUrlParams(requestBody)
			.addHeader('x-secret', this.config.fetchBackupDocsSecretsMap[body.env])
			.addHeader('x-proxy', 'fetch-env')
			.executeSync();

		const backupInfo = response.backupInfo;

		const wrongBackupIdDescriptor = backupInfo._id !== body.backupId;
		if (wrongBackupIdDescriptor)
			throw new BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${body.backupId} received id: ${backupInfo._id}`);


		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const storage = firebaseSessionAdmin.getStorage();
		const bucket = await storage.getMainBucket();
		const backupDoc = await bucket.getFile(backupInfo.filePath);

		const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;
		const bulkWriter = firestore.bulkWriter();
		const hasOnlyModulesArray = body.onlyModules && !!body.onlyModules.length;

		bulkWriter.onWriteError((err) => {
			this.logErrorBold(err);
			return true;
		});

		const dataCallback = async (row: any) => {

			_keys(row).map(key => {
				row[(key as string).trim()] = row[key];
			});

			if (hasOnlyModulesArray && !body.onlyModules?.includes(row.collectionName)) {
				this.logWarning(`Row ${row._id} from collection ${row.collectionName} is skipped from syncing due to not being in the list of specified modules to sync.`);
				return;
			}

			if (!hasOnlyModulesArray && body.excludedModules?.includes(row.collectionName)) {
				this.logWarning(`Row ${row._id} from collection: ${row.collectionName} is skipped from syncing due to being in the excluded modules list.`);
				return;
			}

			const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
			const data = JSON.parse(row.document);
			await bulkWriter.set(documentRef, data);
		};

		await CSVModule.forEachCsvRowFromStream(backupDoc.file.createReadStream(), dataCallback);
		await bulkWriter.close();
	};
}

export const ModuleBE_SyncEnvV2 = new ModuleBE_SyncEnvV2_Class();