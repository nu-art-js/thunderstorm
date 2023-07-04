import {
	__stringify,
	_logger_logException,
	ApiException,
	currentTimeMillis, Day,
	DBDef,
	Dispatcher,
	flatArray,
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	generateHex,
	Module,
	PreDB,
	TS_Object,
	UniqueId
} from '@nu-art/ts-common';
import {createQueryServerApi} from '../../core/typed-api';
import {END_OF_STREAM, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {FirestoreQuery} from '@nu-art/firebase';
import {addRoutes} from '../ApiModule';
import {OnFirestoreBackupSchedulerActV2, OnModuleCleanupV2} from './FirestoreBackupSchedulerV2';
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
	query: FirestoreQuery<T>
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
	quoteStrings: '"',
	decimalSeparator: '.',
	showLabels: true,
	showTitle: false,
	useTextFile: false,
	useBom: true,
	useKeysAsHeaders: true,
};

/**
 * This module is in charge of making a backup of the db in firebase storage,
 * in order to test this module locally run firebase functions:shell command in a terminal
 * when the firebase> shows up write the name of the function you want to run and call it "functionName()"
 * **/
class ModuleBE_BackupV2_Class
	extends Module<Config> {
	public collection!: FirestoreCollectionV2<DB_BackupDoc>;

	constructor() {
		super();
		this.setDefaultConfig({minTimeThreshold: Day, keepInterval: 7 * Day});
		addRoutes([createQueryServerApi(ApiDef_BackupV2.vv1.initiateBackup, this.initiateBackup), createQueryServerApi(ApiDef_BackupV2.vv1.fetchBackupDocs, this.fetchBackupDocs)]);
	}

	protected init(): void {
		this.collection = this.getBackupStatusCollection();
	}

	/**
	 * @param body - needs to contain backupId with the key to fetch.
	 */
	fetchBackupDocs = async (body: Request_BackupId): Promise<Response_BackupDocsV2> => {
		const backupDoc = await this.queryUnique(body.backupId);

		if (!backupDoc)
			throw new ApiException(500, `no backupdoc found with this id ${body.backupId}`);

		return {
			backupInfo: {
				_id: backupDoc._id,
				filePath: backupDoc.backupPath
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

	initiateBackup = async () => {
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

		const backups: FirestoreBackupDetailsV2<any>[] = this.getBackupDetails();
		// this.logInfoBold('-------------------------------------------------------------------------------------------------------');
		// this.logInfoBold('-------------------------------------- Received Backup Details: ---------------------------------------');
		// this.logInfoBold('-------------------------------------------------------------------------------------------------------');
		// this.logInfoBold(typeof backups);
		// this.logInfoBold(Array.isArray(backups));
		// this.logInfoBold(backups.length);
		// this.logInfoBold('-------------------------------------------------------------------------------------------------------');
		const backupId = generateHex(32);
		const nowMs = currentTimeMillis();
		const timeFormat = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
		const backupPath = `backup/firestore/${timeFormat}/backup-${timeFormat}.csv`;

		const query: FirestoreQuery<DB_BackupDoc> = {
			where: {},
			orderBy: [{key: 'timestamp', order: 'asc'}],
			limit: 1
		};

		const docs = await this.query(query);
		const latestDoc = docs[0];

		if (latestDoc && latestDoc.timestamp + this.config.minTimeThreshold > nowMs)
			return; // If the oldest doc is still in the keeping timeframe, don't delete any docs.


		const storage = ModuleBE_Firebase.createAdminSession().getStorage();
		const bucket = await storage.getMainBucket();
		CSVModule.updateExporterSettings(CSVConfig);

		await Promise.all(backups.map(async (backupItem) => {
			try {
				const backupFeeder = async (writable: Writable) => {
					let page = 0;
					let data;

					do {
						data = this.formatToCsv(await backupItem.queryFunction({...backupItem.query, limit: {page, itemsCount: 10000}}), backupItem.moduleKey);

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

						page++;
					} while (data.length);

					return END_OF_STREAM;
				};

				const file = await bucket.getFile(backupPath);
				await file.writeToStream(backupFeeder);
			} catch (e: any) {
				this.logWarning(`backup of ${backupItem.moduleKey} has failed with error`, e);
				const errorMessage = `Error backing up firestore collection config:\n ${__stringify(backupItem, true)}\nError: ${_logger_logException(e)}`;
				throw new ApiException(500, errorMessage, e);
			}

		}));

		try {
			//upsert the backup data
			await this.upsert({timestamp: nowMs, backupPath, _id: backupId});

			const queryOld = {where: {timestamp: {$lt: nowMs - this.config.keepInterval}}};
			const oldDocs = await this.query(queryOld);

			this.logInfoBold('Received items to delete total: ' + oldDocs.length);
			await Promise.all(oldDocs.map(async oldDoc => {
				try {
					await (await bucket.getFile(oldDoc.backupPath)).delete();
					await this.deleteItem(oldDoc);
				} catch (e: any) {
					this.logError('error deleting file: ', oldDoc, e);
				}
			}));

			this.logInfoBold('Successfully deleted item');
		} catch (err: any) {
			throw new ApiException(500, err);
		}
	};

	query = async (ourQuery: FirestoreQuery<DB_BackupDoc>): Promise<DB_BackupDoc[]> => {
		return await this.collection.query.custom(ourQuery);
	};

	queryUnique = async (backupDocId: UniqueId) => {
		return await this.collection.query.unique(backupDocId);
	};

	upsert = async (instance: PreDB<DB_BackupDoc>): Promise<DB_BackupDoc> => {
		this.logWarning(instance);
		return await this.collection.create.item(instance);
	};

	deleteItem = async (instance: DB_BackupDoc): Promise<DB_BackupDoc | undefined> => {
		return await this.collection.delete.unique(instance._id);
	};
}

export const ModuleBE_BackupV2 = new ModuleBE_BackupV2_Class();
