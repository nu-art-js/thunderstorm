import {
	__stringify,
	_logger_logException,
	ApiException,
	currentTimeMillis,
	Day,
	DBDef,
	Dispatcher,
	filterInstances,
	flatArray,
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	LogLevel,
	Minute,
	Module,
	PreDB,
	TS_Object,
	UniqueId
} from '@nu-art/ts-common';
import {createQueryServerApi} from '../../core/typed-api';
import {END_OF_STREAM, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {addRoutes} from '../ModuleBE_APIs';
import {OnFirestoreBackupSchedulerActV2, OnModuleCleanupV2} from './ModuleBE_v2_BackupScheduler';
import {Transaction} from 'firebase-admin/firestore';
import {Writable} from 'stream';
import {CSVModule} from '@nu-art/ts-common/modules/CSVModule';
import {FirestoreCollectionV2} from '@nu-art/firebase/backend/firestore-v2/FirestoreCollectionV2';
import {DB_BackupDoc} from '../../../shared/backup/backup-types';
import {DBDef_BackupDocs} from '../../../shared/backup/db-def';
import {ApiDef_BackupV2, Request_BackupId, Response_BackupDocsV2} from '../../../shared/backup/apis';


export type FirestoreBackupDetailsV2<T extends TS_Object> = {
	moduleKey: string,
	queryFunction: (query: FirestoreQuery<T>, transaction?: Transaction) => Promise<T[]>,
	query: FirestoreQuery<T>,
	version: string
}

const dispatch_onFirestoreBackupSchedulerActV2 = new Dispatcher<OnFirestoreBackupSchedulerActV2, '__onFirestoreBackupSchedulerActV2'>('__onFirestoreBackupSchedulerActV2');
const dispatch_onModuleCleanupV2 = new Dispatcher<OnModuleCleanupV2, '__onCleanupInvokedV2'>('__onCleanupInvokedV2');

type Config = {
	keepInterval: number,
	minTimeThreshold: number,
	excludedCollectionNames?: string[],
}

const CSVConfig = {
	fieldSeparator: ',',
	quoteStrings: '',
	decimalSeparator: '.',
	showLabels: true,
	showTitle: false,
	useTextFile: false,
	useBom: true,
	useKeysAsHeaders: true,
};

export type BackupMetaData = {
	collectionsData: {
		collectionName: string,
		numOfDocs: number,
		version: string
	}[],
	timestamp: number
}

/**
 * This module is in charge of making a backup of the db in firebase storage,
 * in order to test this module locally run firebase functions:shell command in a terminal
 * when the firebase> shows up write the name of the function you want to run and call it "functionName()"
 * **/
class ModuleBE_v2_Backup_Class
	extends Module<Config> {
	public collection!: FirestoreCollectionV2<DB_BackupDoc>;

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.setDefaultConfig({minTimeThreshold: Day, keepInterval: 7 * Day});
	}

	protected init(): void {
		super.init();
		this.collection = this.getBackupStatusCollection();
		addRoutes([
			createQueryServerApi(ApiDef_BackupV2.vv1.initiateBackup, () => this.initiateBackup()),
			createQueryServerApi(ApiDef_BackupV2.vv1.fetchBackupDocs, this.fetchBackupDocs),
		]);
	}

	/**
	 * @param body - needs to contain backupId with the key to fetch.
	 */
	fetchBackupDocs = async (body: Request_BackupId): Promise<Response_BackupDocsV2> => {
		const backupDoc = await this.queryUnique(body.backupId);

		if (!backupDoc)
			throw new ApiException(500, `no backupdoc found with this id ${body.backupId}`);

		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();
		const fireabseDescriptor = await (await bucket.getFile(backupDoc.firebasePath)).getReadSignedUrl(10 * Minute);
		const firestoreDescriptor = await (await bucket.getFile(backupDoc.backupPath)).getReadSignedUrl(10 * Minute);

		return {
			backupInfo: {
				_id: backupDoc._id,
				backupFilePath: backupDoc.backupPath,
				metadataFilePath: backupDoc.metadataPath,
				firebaseFilePath: backupDoc.firebasePath,
				firebaseSignedUrl: fireabseDescriptor.signedUrl,
				firestoreSignedUrl: firestoreDescriptor.signedUrl,
				metadata: backupDoc.metadata
			}
		};
	};

	public getBackupStatusCollection = (): FirestoreCollectionV2<DB_BackupDoc> => {
		return ModuleBE_Firebase.createAdminSession().getFirestoreV2()
			.getCollection(DBDef_BackupDocs as DBDef<DB_BackupDoc>);
	};

	/**
	 * Get metadata objects per each collection module that needs to be backed up.
	 */
	public getBackupDetails = (): FirestoreBackupDetailsV2<any>[] => {
		return flatArray(dispatch_onFirestoreBackupSchedulerActV2.dispatchModule())
			.reduce<FirestoreBackupDetailsV2<any>[]>((resultBackupArray, currentBackup) => {

				if (!currentBackup)
					return resultBackupArray;

				if (this.config.excludedCollectionNames?.includes(currentBackup.moduleKey)) {
					this.logWarningBold(`Skipping module ${currentBackup.moduleKey} since it's in the exclusion list.`);
					return resultBackupArray;
				}

				resultBackupArray.push(currentBackup);

				return resultBackupArray;
			}, []);
	};

	private formatToCsv = (docArray: TS_Object[], moduleKey: string) => {
		return docArray.map(doc => ({collectionName: moduleKey, _id: doc._id, document: __stringify(doc)}));
	};

	initiateBackup = async (force = false) => {
		const nowMs = currentTimeMillis();
		const timeFormat = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
		const backupPath = `backup/${timeFormat}/firestore-backup.csv`;
		const metadataPath = `backup/${timeFormat}/metadata.json`;
		const configPath = `backup/${timeFormat}/firebase-backup.json`;

		const query: FirestoreQuery<DB_BackupDoc> = {
			where: {},
			orderBy: [{key: 'timestamp', order: 'asc'}],
			limit: 1
		};

		const docs = await this.query(query);
		const latestDoc = docs[0];

		if (!force && latestDoc && latestDoc.timestamp + this.config.minTimeThreshold > nowMs)
			return; // If the oldest doc is still in the keeping timeframe, don't delete any docs.

		if (this.config.excludedCollectionNames)
			this.logInfo(`Found excluded modules list: ${this.config.excludedCollectionNames}`);

		try {
			this.logInfo('Cleaning modules...');
			await dispatch_onModuleCleanupV2.dispatchModuleAsync();
			this.logInfo('Cleaned modules!');
		} catch (e: any) {
			this.logWarning(`modules cleanup has failed with error`, e);
			const errorMessage = `modules cleanup has failed with error\nError: ${_logger_logException(e)}`;
			throw new ApiException(500, errorMessage, e);
		}

		const backups: FirestoreBackupDetailsV2<any>[] = filterInstances(this.getBackupDetails());
		let backupsCounter = 0;

		const firebaseSessionAdmin = ModuleBE_Firebase.createAdminSession();
		const storage = firebaseSessionAdmin.getStorage();
		const bucket = await storage.getMainBucket();
		const fullPathToBackup = `${bucket.getBucketName()}/${backupPath}`;
		CSVModule.updateExporterSettings(CSVConfig);
		const metadata: BackupMetaData = {collectionsData: [], timestamp: nowMs};

		if (backups.length === 0)
			throw new ApiException(404, 'No modules to backup');

		const backupFeeder = async (writable: Writable) => {
			if (!backups[backupsCounter])
				return END_OF_STREAM;

			const currBackup = backups[backupsCounter];

			let page = 0;
			let docCounter = 0;
			let data;

			do {
				data = this.formatToCsv(await currBackup.queryFunction({
					...currBackup.query,
					limit: {page, itemsCount: 10000}
				}), currBackup.moduleKey);

				if (data.length) {
					const csv = CSVModule.export(data);

					if (page === 0)
						CSVModule.updateExporterSettings({
							...CSVConfig,
							showLabels: false,
							useKeysAsHeaders: false
						});

					writable.write(csv.toString());
				}

				docCounter += data.length;
				page++;
			} while (data.length);

			metadata.collectionsData.push({
				collectionName: currBackup.moduleKey,
				numOfDocs: docCounter,
				version: currBackup.version
			});

			backupsCounter++;

		};

		try {
			this.logDebug('Creating backup file...');
			const file = await bucket.getFile(backupPath);
			await file.writeToStream(backupFeeder);
			this.logDebug('Backup file created');

			this.logDebug('Backing up config db');
			const database = firebaseSessionAdmin.getDatabase();
			const configBackup = await database.ref('/').get();
			const configFile = await bucket.getFile(configPath);
			await configFile.write(configBackup as object);
			this.logDebug('Config file created');

			this.logDebug('Creating metadata file...');
			const metadataFile = await bucket.getFile(metadataPath);
			await metadataFile.write(metadata);
			this.logDebug('Metadata file created');
		} catch (e: any) {
			this.logWarning(`backup of ${backups[backupsCounter].moduleKey} has failed with error`, e);
			const errorMessage = `Error backing up firestore collection config:\n ${__stringify(backups[backupsCounter], true)}\nError: ${_logger_logException(e)}`;
			throw new ApiException(500, errorMessage, e);
		}

		const dbBackup = await this.upsert({
			timestamp: nowMs,
			backupPath,
			metadataPath,
			firebasePath: configPath,
			metadata
		});
		this.logWarning(dbBackup);

		const oldBackupsToDelete = await this.query({where: {timestamp: {$lt: nowMs - this.config.keepInterval}}});
		if (oldBackupsToDelete.length === 0) {
			this.logInfoBold('No older backups to delete');
			return {pathToBackup: fullPathToBackup};
		}

		try {
			this.logInfoBold('Received older backups to delete, count: ' + oldBackupsToDelete.length);
			await Promise.all(oldBackupsToDelete.map(async oldDoc => (filterInstances([oldDoc.metadataPath, oldDoc.backupPath, oldDoc.firebasePath])
				.map(async path => (await bucket.getFile(path)).delete()))));
			await this.collection.delete.all(oldBackupsToDelete);
			this.logInfoBold('Successfully deleted old backups');
		} catch (err: any) {
			this.logWarning(`Error while cleaning up older backups`, err);
			throw new ApiException(500, err);
		}

		return {pathToBackup: fullPathToBackup};
	};

	query = async (ourQuery: FirestoreQuery<DB_BackupDoc>): Promise<DB_BackupDoc[]> => {
		return await this.collection.query.custom(ourQuery);
	};

	queryUnique = async (backupDocId: UniqueId) => {
		return await this.collection.query.unique(backupDocId);
	};

	upsert = async (instance: PreDB<DB_BackupDoc>): Promise<DB_BackupDoc> => {
		return await this.collection.create.item(instance);
	};

	deleteItem = async (instance: DB_BackupDoc): Promise<DB_BackupDoc | undefined> => {
		return await this.collection.delete.unique(instance._id);
	};
}

export const ModuleBE_v2_Backup = new ModuleBE_v2_Backup_Class();
