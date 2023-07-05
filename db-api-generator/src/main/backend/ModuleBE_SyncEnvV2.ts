import {ApiDef, HttpMethod, QueryApi, Request_BackupId, Response_BackupDocsV2} from '@nu-art/thunderstorm';
import {addRoutes, AxiosHttpModule, createBodyServerApi, createQueryServerApi} from '@nu-art/thunderstorm/backend';
import {_keys, BadImplementationException, Module, TypedMap} from '@nu-art/ts-common';
import {ApiDef_SyncEnvV2, Request_FetchFromEnv} from '../shared';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {ModuleBE_BackupV2} from '@nu-art/thunderstorm/backend/modules/backup/ModuleBE_BackupV2';


type Config = {
    urlMap: TypedMap<string>
    fetchBackupDocsSecretsMap: TypedMap<string>,
    maxBatch: number
}

class ModuleBE_SyncEnvV2_Class
    extends Module<Config> {

    constructor() {
        super();
        this.setDefaultConfig({maxBatch: 500});
        addRoutes([createBodyServerApi(ApiDef_SyncEnvV2.vv1.fetchFromEnv, this.fetchFromEnv)]);
        addRoutes([createQueryServerApi(ApiDef_SyncEnvV2.vv1.createBackup, this.createBackup)]);
    }

    // private formatCsvToMapper = (csvContent: CsvRow[]) => {
    //
    // };
    createBackup = async () => {
        return ModuleBE_BackupV2.initiateBackup(true);
    };

    fetchFromEnv = async (body: Request_FetchFromEnv) => {
        this.logInfoBold('Received API call Fetch From Env!');
        this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);
        if (!body.env)
            throw new BadImplementationException(`Did not receive env in the fetch from env api call!`);

        if (body.onlyModules && body.excludedModules)
            this.logWarningBold('excludedModules config exists alongside onlyModules, so excludedModules are ignored.');

        // this.logInfo('\n\n\n\n\noyoyoyoyo');
        // this.logInfo(this.config.urlMap);
        // this.logInfo('\n\n\n\n\n');
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

        const wrongBackupIdDescriptor = backupInfo?._id !== body.backupId;
        if (wrongBackupIdDescriptor)
            throw new BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${body.backupId} received id: ${backupInfo?._id}`);

        const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
        const storage = firebaseSessionAdmin.getStorage();
        const bucket = await storage.getMainBucket();
        const backupDoc = await bucket.getFile(backupInfo.filePath);

        const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;
        const hasOnlyModulesArray = body.onlyModules && !!body.onlyModules.length;


        const resultsArray: { ref: FirebaseFirestore.DocumentReference, data: any }[] = [];

        const dataCallback = (row: any, index: number) => {
            _keys(row).map(key => {
                row[(key as string).trim()] = (row[key] as string).trim();
            });

            if (hasOnlyModulesArray && !body.onlyModules?.includes(row.collectionName))
                return;

            if (!hasOnlyModulesArray && body.excludedModules?.includes(row.collectionName))
                return;

            const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
            const data = JSON.parse(row.document);

            resultsArray.push({ref: documentRef, data: data});
        };
        await CSVModule.forEachCsvRowFromStreamSync(backupDoc.file.createReadStream(), dataCallback);


        for (let i = 0; i < resultsArray.length; i += this.config.maxBatch) {
            const writeBatch = firestore.batch();
            const batch = resultsArray.slice(i, i + this.config.maxBatch);

            batch.map(item => writeBatch.set(item.ref, item.data));

            await writeBatch.commit()
        }

    };
}

export const ModuleBE_SyncEnvV2 = new ModuleBE_SyncEnvV2_Class();