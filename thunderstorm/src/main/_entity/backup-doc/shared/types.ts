import {DB_Object, DBProto, Proto_DB_Object, VersionsDeclaration} from '@nu-art/ts-common';

type VersionTypes_BackupDoc = { '1.0.0': DB_BackupDoc }
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_BackupDoc>;
type Dependencies = {}
type UniqueKeys = '_id';
type GeneratedProps = never
type DBKey = 'firestore-backup-status-v2'
type Proto = Proto_DB_Object<DB_BackupDoc, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>;
export type DBProto_BackupDoc = DBProto<Proto>;
export type UI_BackupDoc = DBProto_BackupDoc['uiType'];

export type DB_BackupDoc = DB_Object & {
	timestamp: number,
	backupPath: string,
	metadataPath: string,
	firebasePath: string,
	metadata: BackupMetaData
}

export type ActDetailsDoc = {
	timestamp: number,
	moduleKey: string
}

export type BackupDoc = ActDetailsDoc & {
	backupPath: string,
	backupId: string,
}

export type FetchBackupDoc = {
	_id: string,
	backupFilePath: string,
	metadataFilePath: string,
	firebaseFilePath: string,
	firestoreSignedUrl: string,
	firebaseSignedUrl: string,
	metadata: BackupMetaData
}

export type BackupMetaData = {
	collectionsData: {
		dbKey: string,
		numOfDocs: number,
		version: string
	}[],
	timestamp: number
}