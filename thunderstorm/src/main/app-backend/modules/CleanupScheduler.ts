import {
	currentTimeMillies,
	Dispatcher
} from "@nu-art/ts-common";
import {FirebaseScheduledFunction} from "@nu-art/firebase/app-backend/functions/firebase-function";
import {FirebaseModule} from "@nu-art/firebase/app-backend/FirebaseModule";

enum CleanupStatus {
	Success = "Success",
	Failure = "Failure"
}

export type CleanupDoc = {
	timeStamp: number,
	status: CleanupStatus,
	moduleKey: string
}

export type CleanupDetails = {
	cleanup: () => Promise<void>,
	interval: number,
	moduleKey: string
}

export interface OnCleanupSchedulerAct {
	__onCleanupSchedulerAct: () => CleanupDetails
}

const dispatch_onCleanupSchedulerAct = new Dispatcher<OnCleanupSchedulerAct, "__onCleanupSchedulerAct">("__onCleanupSchedulerAct");

export class CleanupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 1 hours');
	}

	onScheduledEvent = async (): Promise<any> => {
		const cleanupStatusCollection =  FirebaseModule.createAdminSession().getFirestore().getCollection<CleanupDoc>('cleanup-status', ["moduleKey"]);
		const cleanups = dispatch_onCleanupSchedulerAct.dispatchModule([]);
		await Promise.all(cleanups.map(async cleanupItem => {
			const doc = await cleanupStatusCollection.queryUnique({where: {moduleKey: cleanupItem.moduleKey}});
			if (doc && doc.timeStamp + cleanupItem.interval > currentTimeMillies() && doc.status !== CleanupStatus.Failure)
				return;

			let status: CleanupStatus = CleanupStatus.Success;
			try {
				await cleanupItem.cleanup();
			} catch (e) {
				status = CleanupStatus.Failure;
				this.logWarning(`cleanup of ${cleanupItem.moduleKey} has failed with error '${e}'`);
			} finally {
				await cleanupStatusCollection.upsert({timeStamp: currentTimeMillies(), status, moduleKey: cleanupItem.moduleKey});
			}
		}));
	};
}

export const CleanupScheduler = new CleanupScheduler_Class();
