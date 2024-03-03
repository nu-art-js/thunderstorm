import {ModuleBE_FirebaseScheduler} from '@nu-art/firebase/backend';
import {ModuleBE_BackupDocDB} from './ModuleBE_BackupDocDB';


class ModuleBE_BackupScheduler_Class
	extends ModuleBE_FirebaseScheduler {

	constructor() {
		super();
		this.setSchedule('every 24 hours');
		this.runtimeOptions.set({timeoutSeconds: 540, maxInstances: 1, memory: '2GB'});
	}

	onScheduledEvent = async (): Promise<any> => {
		this.logInfoBold(`Running function ${this.getName()}`);
		await ModuleBE_BackupDocDB.initiateBackup();
	};
}

export const ModuleBE_BackupScheduler = new ModuleBE_BackupScheduler_Class();