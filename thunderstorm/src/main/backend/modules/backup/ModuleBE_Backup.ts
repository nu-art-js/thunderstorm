import {
	__stringify,
	_logger_logException,
	currentTimeMillis,
	dispatch_onServerError,
	Dispatcher,
	filterInstances,
	Format_YYYYMMDD_HHmmss,
	formatTimestamp,
	generateHex,
	Minute,
	Module,
	ServerErrorSeverity,
	TS_Object
} from '@nu-art/ts-common';
import {ApiDef_Backup, Request_BackupId, Response_BackupDocs} from '../../../shared';
import {createQueryServerApi} from '../../core/typed-api';
import {FirestoreCollection, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {OnFirestoreBackupSchedulerAct, OnModuleCleanup} from './FirestoreBackupScheduler';
import {FilterKeys, FirestoreQuery} from '@nu-art/firebase';
import {BackupDoc} from '../../../shared/backup-types';
import {addRoutes} from '../ApiModule';


export type FirestoreBackupDetails<T extends TS_Object> = {
	moduleKey: string,
	minTimeThreshold: number, // minimum time to pass before another backup can occur.
	keepInterval?: number, // how long to keep
	collection: FirestoreCollection<T>,
	backupQuery: FirestoreQuery<T>
}

const dispatch_onFirestoreBackupSchedulerAct = new Dispatcher<OnFirestoreBackupSchedulerAct, '__onFirestoreBackupSchedulerAct'>('__onFirestoreBackupSchedulerAct');
const dispatch_onModuleCleanup = new Dispatcher<OnModuleCleanup, '__onCleanupInvoked'>('__onCleanupInvoked');

type Config = {
	excludedCollectionNames?: string[]
}

class ModuleBE_Backup_Class
	extends Module<Config> {
	public collection!: FirestoreCollection<BackupDoc>;

	constructor() {
		super();
		addRoutes([createQueryServerApi(ApiDef_Backup.vv1.initiateBackup, this.initiateBackup), createQueryServerApi(ApiDef_Backup.vv1.fetchBackupDocks, this.fetchBackupDocks)]);
	}

	protected init(): void {
		this.collection = this.getBackupStatusCollection();
	}

	/**
	 * @param body - needs to contain backupId with the key to fetch.
	 */
	fetchBackupDocks = async (body: Request_BackupId): Promise<Response_BackupDocs> => {
		const backupDocs = await this.query({where: {backupId: body.backupId}});
		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();

		const fetchBackupDocs = await Promise.all(backupDocs.map(async (doc) => {
			const fileDescriptor = await (await bucket.getFile(doc.backupPath)).getReadSecuredUrl('', 10 * Minute);
			return {
				backupId: doc.backupId,
				moduleKey: doc.moduleKey,
				signedUrl: fileDescriptor.securedUrl,
			};
		}));
		return {backupDescriptors: fetchBackupDocs};
	};

	public getBackupStatusCollection = (): FirestoreCollection<BackupDoc> => {
		return ModuleBE_Firebase.createAdminSession().getFirestore()
			.getCollection<BackupDoc>('firestore-backup-status', ['moduleKey', 'timestamp'] as FilterKeys<BackupDoc>);
	};

	/**
	 * Get metadata objects per each collection module that needs to be backed up.
	 */
	public getBackupDetails = (): FirestoreBackupDetails<any>[] => filterInstances(dispatch_onFirestoreBackupSchedulerAct.dispatchModule())
		.reduce<FirestoreBackupDetails<any>[]>((resultBackupArray, currentBackup) => {

			const backupsToAdd = currentBackup?.filter(backup => !this.config.excludedCollectionNames?.includes(backup.moduleKey));

			if (backupsToAdd)
				resultBackupArray.push(...backupsToAdd);
			return resultBackupArray;
		}, []);

	initiateBackup = async () => {
		try {
			this.logInfo('Cleaning modules...');
			await dispatch_onModuleCleanup.dispatchModuleAsync();
			this.logInfo('Cleaned modules!');
		} catch (e: any) {
			this.logWarning(`modules cleanup has failed with error`, e);
			const errorMessage = `modules cleanup has failed with error\nError: ${_logger_logException(e)}`;

			await dispatch_onServerError.dispatchModuleAsync(ServerErrorSeverity.Critical, this, errorMessage);
		}

		const backups: FirestoreBackupDetails<any>[] = this.getBackupDetails();
		const backupId = generateHex(32);
		const nowMs = currentTimeMillis();

		const bucket = await ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket();
		await Promise.all(backups.map(async (backupItem) => {
			const query: FirestoreQuery<BackupDoc> = {
				where: {moduleKey: backupItem.moduleKey},
				orderBy: [{key: 'timestamp', order: 'asc'}],
				limit: 1
			};

			const docs = await this.query(query);
			const latestDoc = docs[0];
			if (latestDoc && latestDoc.timestamp + backupItem.minTimeThreshold > nowMs)
				return; // If the oldest doc is still in the keeping timeframe, don't delete any docs.

			const timeFormat = formatTimestamp(Format_YYYYMMDD_HHmmss, nowMs);
			const backupPath = `backup/firestore/${timeFormat}/${backupItem.moduleKey}.json`;
			try {
				const toBackupData = await backupItem.collection.query(backupItem.backupQuery);
				await (await bucket.getFile(backupPath)).write(toBackupData);

				this.logInfoBold('Upserting Backup for ' + backupItem.moduleKey);
				await this.upsert({timestamp: nowMs, moduleKey: backupItem.moduleKey, backupPath, backupId: backupId});

				this.logInfoBold('Upserting BackupStatus for ' + backupItem.moduleKey); // happened 30 seconds later
				const keepInterval = backupItem.keepInterval;
				if (keepInterval) {
					this.logInfoBold('Querying for items to delete for ' + backupItem.moduleKey);
					const queryOld = {where: {moduleKey: backupItem.moduleKey, timestamp: {$lt: nowMs - keepInterval}}};
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

					this.logInfoBold('Successfully deleted items for ' + backupItem.moduleKey);
				}

			} catch (e: any) {
				this.logWarning(`backup of ${backupItem.moduleKey} has failed with error`, e);
				const errorMessage = `Error backing up firestore collection config:\n ${__stringify(backupItem, true)}\nError: ${_logger_logException(e)}`;

				await dispatch_onServerError.dispatchModuleAsync(ServerErrorSeverity.Critical, this, errorMessage);
			}
		}));
	};

	query = async (ourQuery: FirestoreQuery<BackupDoc>): Promise<BackupDoc[]> => {
		return await this.collection.query(ourQuery);
	};

	upsert = async (instance: BackupDoc): Promise<BackupDoc> => {
		this.logWarning(instance);
		return await this.collection.upsert(instance);
	};

	deleteItem = async (instance: BackupDoc): Promise<BackupDoc | undefined> => {
		return await this.collection.deleteItem(instance);
	};
}

export const ModuleBE_Backup = new ModuleBE_Backup_Class();
