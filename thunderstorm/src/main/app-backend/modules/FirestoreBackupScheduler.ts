import {
	currentTimeMillies,
	Dispatcher,
	dispatch_onServerError,
	filterInstances,
    ServerErrorSeverity,
	_logger_logException,
	__stringify
} from "@nu-art/ts-common";
import {FirebaseScheduledFunction} from "@nu-art/firebase/app-backend/functions/firebase-function";
import {FirebaseModule} from "@nu-art/firebase/app-backend/FirebaseModule";
import {ActDetailsDoc,} from "./CleanupScheduler";
import {FirestoreCollection} from "@nu-art/firebase/app-backend/firestore/FirestoreCollection";
import {FirestoreQuery} from "@nu-art/firebase";

export type BackupDoc = ActDetailsDoc & {
	backupPath: string,
}

export type FirestoreBackupDetails<T extends object> = {
	moduleKey: string,
	interval: number,
	keepInterval?: number,
	collection: FirestoreCollection<T>,
	backupQuery: FirestoreQuery<T>
}

export interface OnFirestoreBackupSchedulerAct<T extends object> {
	__onFirestoreBackupSchedulerAct: () => FirestoreBackupDetails<T>
}

const dispatch_onFirestoreBackupSchedulerAct = new Dispatcher<OnFirestoreBackupSchedulerAct<any>, "__onFirestoreBackupSchedulerAct">(
	"__onFirestoreBackupSchedulerAct");

export class FirestoreBackupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 24 hours');
	}

	onScheduledEvent = async (): Promise<any> => {
		const backupStatusCollection = FirebaseModule.createAdminSession().getFirestore().getCollection<BackupDoc>('firestore-backup-status',
		                                                                                                           ["moduleKey", "timestamp"]);
		const backups = filterInstances(dispatch_onFirestoreBackupSchedulerAct.dispatchModule([]));

		const bucket = await FirebaseModule.createAdminSession().getStorage().getOrCreateBucket();
		await Promise.all(backups.map(async (backupItem) => {
			const query: FirestoreQuery<BackupDoc> = {
				where: {moduleKey: backupItem.moduleKey},
				orderBy: [{key: "timestamp", order: "asc"}],
			};
			const docs = await backupStatusCollection.query(query);
			const latestDoc = docs[0];
			if (latestDoc && latestDoc.timestamp + backupItem.interval > currentTimeMillies())
				return;

			const backupPath = `backup/firestore/${backupItem.moduleKey}/${currentTimeMillies()}.json`;
			try {
				const toBackupData = await backupItem.collection.query(backupItem.backupQuery);
				await (await bucket.getFile(backupPath)).write(toBackupData);
				await backupStatusCollection.upsert({timestamp: currentTimeMillies(), moduleKey: backupItem.moduleKey, backupPath});


				//TODO yair... here clean up the backups till ${backupItem.keepInterval}

			} catch (e) {
				this.logWarning(`backup of ${backupItem.moduleKey} has failed with error`,e);
				const errorMessage = `Error backing up firestore collection config:\n ${__stringify(backupItem, true)}\nError: ${_logger_logException(e)}`;

				await dispatch_onServerError.dispatchModuleAsync([ServerErrorSeverity.Critical, this, errorMessage]);

			}
		}));
	};
}

export const FirestoreBackupScheduler = new FirestoreBackupScheduler_Class();
