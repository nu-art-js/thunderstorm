import {
	batchActionParallel,
	currentTimeMillies,
	Dispatcher,
	filterInstances
} from "@nu-art/ts-common";
import {FirebaseScheduledFunction} from "@nu-art/firebase/app-backend/functions/firebase-function";
import {FirebaseModule} from "@nu-art/firebase/app-backend/FirebaseModule";
import {
	ActDetailsDoc,
	ActStatus
} from "./CleanupScheduler";
import {FirestoreCollection} from "@nu-art/firebase/app-backend/firestore/FirestoreCollection";
import {FirestoreQuery} from "@nu-art/firebase";

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
		const backupStatusCollection = FirebaseModule.createAdminSession().getFirestore().getCollection<ActDetailsDoc>('firestore-backup-status', ["moduleKey"]);
		const backups = filterInstances(dispatch_onFirestoreBackupSchedulerAct.dispatchModule([]));
		const docs = await batchActionParallel(backups.map(backupItem => backupItem.moduleKey), 10,
		                                       (chunk) => backupStatusCollection.query({where: {moduleKey: {$in: chunk}}}))

		await Promise.all(backups.map(async (backupItem, index) => {
			const doc = docs[index];
			if (doc && doc.timeStamp + backupItem.interval > currentTimeMillies() && doc.status === ActStatus.Success)
				return;

			let status: ActStatus = ActStatus.Success;
			try {
				const toBackupData = await backupItem.collection.query(backupItem.backupQuery);
				const backupPath = `backup/firestore/${backupItem.moduleKey}/${currentTimeMillies()}.json`;
				await (await (await FirebaseModule.createAdminSession().getStorage().getOrCreateBucket()).getFile(backupPath)).write(toBackupData);

				//TODO yair... here clean up the backups till ${backupItem.keepInterval}

			} catch (e) {
				status = ActStatus.Failure;
				this.logWarning(`backup of ${backupItem.moduleKey} has failed with error '${e}'`);
			} finally {
				await backupStatusCollection.upsert({timeStamp: currentTimeMillies(), status, moduleKey: backupItem.moduleKey});
			}
		}));
	};
}

export const FirestoreBackupScheduler = new FirestoreBackupScheduler_Class();
