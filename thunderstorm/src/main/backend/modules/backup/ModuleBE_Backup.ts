import {Dispatcher, filterInstances, Module, TS_Object} from '@nu-art/ts-common';
import {ApiDefServer} from '../../utils/api-caller-types';
import {ApiDef_Backup, ApiStruct_Backup} from '../../../shared';
import {createQueryServerApi} from '../../core/typed-api';
import {FirestoreCollection, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {BackupDoc, FirestoreBackupScheduler, OnFirestoreBackupSchedulerAct} from './FirestoreBackupScheduler';
import {FilterKeys, FirestoreQuery} from '@nu-art/firebase';

export type FirestoreBackupDetails<T extends TS_Object> = {
	moduleKey: string,
	minTimeThreshold: number, // minimum time to pass before another backup can occur.
	keepInterval?: number, // how long to keep
	collection: FirestoreCollection<T>,
	backupQuery: FirestoreQuery<T>
}

const dispatch_onFirestoreBackupSchedulerAct = new Dispatcher<OnFirestoreBackupSchedulerAct, '__onFirestoreBackupSchedulerAct'>('__onFirestoreBackupSchedulerAct');


class ModuleBE_Backup_Class<DBType extends BackupDoc & TS_Object>
	extends Module<{}> {
	readonly vv1: ApiDefServer<ApiStruct_Backup>['vv1'];
	public collection!: FirestoreCollection<DBType>;

	constructor() {
		super();
		this.vv1 = {
			initiateBackup: createQueryServerApi(ApiDef_Backup.vv1.initiateBackup, this.initiateBackup),
		};
	}

	protected init(): void {
		this.collection = this.getBackupStatusCollection();
	}

	public getBackupStatusCollection = (): FirestoreCollection<DBType> => {
		return ModuleBE_Firebase.createAdminSession().getFirestore()
			.getCollection<DBType>('firestore-backup-status', ['moduleKey', 'timestamp'] as FilterKeys<DBType>);
	};

	public getBackupDetails = (): FirestoreBackupDetails<any>[] => filterInstances(dispatch_onFirestoreBackupSchedulerAct.dispatchModule()).reduce<FirestoreBackupDetails<any>[]>((resultBackupArray, currentBackup) => {
		if (currentBackup)
			resultBackupArray.push(...currentBackup);
		return resultBackupArray;
	}, []);

	initiateBackup = async () => {
		return await FirestoreBackupScheduler.onScheduledEvent(true);
	};

	query = async (ourQuery: FirestoreQuery<DBType>): Promise<DBType[]> => {
		return await this.collection.query(ourQuery);
	};

	upsert = async (instance: DBType): Promise<DBType> => {
		this.logWarning(instance);
		return await this.collection.upsert(instance);
	};

	deleteItem = async (instance: DBType): Promise<DBType | undefined> => {
		return await this.collection.deleteItem(instance);
	};
}

export const ModuleBE_Backup = new ModuleBE_Backup_Class();
