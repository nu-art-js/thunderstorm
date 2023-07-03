import {DB_Object} from '@nu-art/ts-common';

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
	signedUrl: string,
}

export type DB_BackupDoc = DB_Object & {
	timestamp: number,
	backupPath: string,
}