"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModuleBE_v2_SyncEnv = void 0;
const thunderstorm_1 = require("@nu-art/thunderstorm");
const backend_1 = require("@nu-art/thunderstorm/backend");
const ts_common_1 = require("@nu-art/ts-common");
const shared_1 = require("../shared");
const CSVModule_1 = require("@nu-art/ts-common/modules/CSVModule");
const backend_2 = require("@nu-art/firebase/backend");
const ModuleBE_v2_Backup_1 = require("@nu-art/thunderstorm/backend/modules/backup/ModuleBE_v2_Backup");
class ModuleBE_v2_SyncEnv_Class extends ts_common_1.Module {
    constructor() {
        super();
        this.fetchBackupMetadata = async (queryParams) => {
            const backupInfo = await this.getBackupInfo(queryParams);
            if (!backupInfo)
                throw new ts_common_1.ApiException(404, 'backup file not found');
            if (!backupInfo.metadata)
                throw new ts_common_1.ApiException(404, 'No metadata found on this backup');
            return backupInfo.metadata;
        };
        this.createBackup = async () => {
            return ModuleBE_v2_Backup_1.ModuleBE_v2_Backup.initiateBackup(true);
        };
        this.fetchFromEnv = async (body) => {
            this.logInfoBold('Received API call Fetch From Env!');
            this.logInfo(`Origin env: ${body.env}, bucketId: ${body.backupId}`);
            const backupInfo = await this.getBackupInfo(body);
            this.logInfo(backupInfo);
            if (!backupInfo.backupFilePath)
                throw new ts_common_1.ApiException(404, 'Backup file path not found');
            const firebaseSessionAdmin = backend_2.ModuleBE_Firebase.createAdminSession();
            const firestore = firebaseSessionAdmin.getFirestoreV2().firestore;
            let resultsArray = [];
            const readBatchSize = this.config.maxBatch * 4;
            let totalReadCount = 0;
            const dataCallback = (row, index) => {
                if (index < totalReadCount || resultsArray.length === readBatchSize)
                    return;
                (0, ts_common_1._keys)(row).map(key => {
                    row[key.trim()] = row[key].trim();
                });
                if (!body.selectedModules.includes(row.collectionName))
                    return;
                const documentRef = firestore.doc(`${row.collectionName}/${row._id}`);
                const data = JSON.parse(row.document);
                resultsArray.push({ ref: documentRef, data: data });
            };
            do {
                resultsArray = [];
                const signedUrlDef = {
                    method: thunderstorm_1.HttpMethod.GET,
                    path: '',
                    fullUrl: backupInfo.firestoreSignedUrl
                };
                const stream = await backend_1.AxiosHttpModule
                    .createRequest(signedUrlDef)
                    .setResponseType('stream')
                    .executeSync();
                await CSVModule_1.CSVModule.forEachCsvRowFromStreamSync(stream, dataCallback);
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
        this.fetchFirebaseBackup = async (queryParams) => {
            try {
                this.logDebug('Getting the firebase backup file');
                const firebaseSessionAdmin = backend_2.ModuleBE_Firebase.createAdminSession();
                const backupInfo = await this.getBackupInfo(queryParams);
                const database = firebaseSessionAdmin.getDatabase();
                this.logDebug('Reading the file from storage');
                const signedUrlDef = {
                    method: thunderstorm_1.HttpMethod.GET,
                    path: '',
                    fullUrl: backupInfo.firebaseSignedUrl
                };
                const firebaseFile = await backend_1.AxiosHttpModule
                    .createRequest(signedUrlDef)
                    .executeSync();
                this.logDebug('Setting the file in firebase database');
                await database.set('/', firebaseFile);
            }
            catch (err) {
                throw new ts_common_1.ApiException(500, err);
            }
        };
        this.setDefaultConfig({ maxBatch: 500 });
    }
    init() {
        super.init();
        (0, backend_1.addRoutes)([
            (0, backend_1.createBodyServerApi)(shared_1.ApiDef_SyncEnvV2.vv1.fetchFromEnv, this.fetchFromEnv),
            (0, backend_1.createQueryServerApi)(shared_1.ApiDef_SyncEnvV2.vv1.createBackup, this.createBackup),
            (0, backend_1.createQueryServerApi)(shared_1.ApiDef_SyncEnvV2.vv1.fetchBackupMetadata, this.fetchBackupMetadata),
            (0, backend_1.createQueryServerApi)(shared_1.ApiDef_SyncEnvV2.vv1.fetchFirebaseBackup, this.fetchFirebaseBackup),
        ]);
    }
    async getBackupInfo(queryParams) {
        const { backupId, env } = queryParams;
        if (!env)
            throw new ts_common_1.BadImplementationException(`Did not receive env in the fetch from env api call!`);
        const url = `${this.config.urlMap[env]}/v1/fetch-backup-docs-v2`;
        const outputDef = { method: thunderstorm_1.HttpMethod.GET, path: '', fullUrl: url };
        const requestBody = { backupId };
        try {
            const response = await backend_1.AxiosHttpModule
                .createRequest(outputDef)
                .setUrlParams(requestBody)
                .addHeader('x-secret', this.config.fetchBackupDocsSecretsMap[env])
                .addHeader('x-proxy', 'fetch-env')
                .executeSync();
            const backupInfo = response.backupInfo;
            const wrongBackupIdDescriptor = (backupInfo === null || backupInfo === void 0 ? void 0 : backupInfo._id) !== backupId;
            if (wrongBackupIdDescriptor)
                throw new ts_common_1.BadImplementationException(`Received backup descriptors with wrong backupId! provided id: ${backupId} received id: ${backupInfo === null || backupInfo === void 0 ? void 0 : backupInfo._id}`);
            return backupInfo;
        }
        catch (err) {
            throw new ts_common_1.ApiException(500, err);
        }
    }
}
exports.ModuleBE_v2_SyncEnv = new ModuleBE_v2_SyncEnv_Class();
//# sourceMappingURL=ModuleBE_v2_SyncEnv.js.map