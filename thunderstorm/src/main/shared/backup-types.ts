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