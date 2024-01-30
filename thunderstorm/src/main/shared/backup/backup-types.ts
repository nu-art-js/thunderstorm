import {DB_Object} from '@nu-art/ts-common';
import {BackupMetaData} from '../../backend/modules/backup/ModuleBE_v2_Backup';

export type ActDetailsDoc = {
	timestamp: number,
	moduleKey: string
}

export type BackupDoc = ActDetailsDoc & {
	backupPath: string,
	backupId: string,
}

export type FetchBackupDoc = {
	backupId: string,
	moduleKey: string,
	signedUrl: string,
}

export type FetchBackupDocV2 = {
	_id: string,
	backupFilePath: string,
	metadataFilePath: string,
	firebaseFilePath: string,
	firestoreSignedUrl: string,
	firebaseSignedUrl: string,
	metadata: BackupMetaData
}

export type DB_BackupDoc = DB_Object & {
	timestamp: number,
	backupPath: string,
	metadataPath: string,
	firebasePath: string,
	metadata: BackupMetaData
}