import {currentTimeMillis, Dispatcher} from '@nu-art/ts-common';
import {FirebaseScheduledFunction} from '@nu-art/firebase/app-backend/functions/firebase-function';
import {FirebaseModule} from '@nu-art/firebase/app-backend/FirebaseModule';

export type ActDetailsDoc = {
	timestamp: number,
	moduleKey: string
}

export type CleanupDetails = {
	cleanup: () => Promise<void>,
	interval: number,
	moduleKey: string
}

export interface OnCleanupSchedulerAct {
	__onCleanupSchedulerAct: () => CleanupDetails;
}

const dispatch_onCleanupSchedulerAct = new Dispatcher<OnCleanupSchedulerAct, '__onCleanupSchedulerAct'>('__onCleanupSchedulerAct');

export class CleanupScheduler_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super();
		this.setSchedule('every 1 hours');
	}

	onScheduledEvent = async (): Promise<any> => {
		const cleanupStatusCollection = FirebaseModule.createAdminSession().getFirestore().getCollection<ActDetailsDoc>('cleanup-status', ['moduleKey']);
		const cleanups = dispatch_onCleanupSchedulerAct.dispatchModule();
		await Promise.all(cleanups.map(async cleanupItem => {
			const doc = await cleanupStatusCollection.queryUnique({where: {moduleKey: cleanupItem.moduleKey}});
			if (doc && doc.timestamp + cleanupItem.interval > currentTimeMillis())
				return;

			try {
				await cleanupItem.cleanup();
				await cleanupStatusCollection.upsert({timestamp: currentTimeMillis(), moduleKey: cleanupItem.moduleKey});
			} catch (e: any) {
				this.logWarning(`cleanup of ${cleanupItem.moduleKey} has failed with error '${e}'`);
			}
		}));
	};
}

export const CleanupScheduler = new CleanupScheduler_Class();
