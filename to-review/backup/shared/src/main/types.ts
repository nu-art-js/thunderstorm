/*
 * @nu-art/backup-shared - Backup API and DB types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_Prototype, DB_ProtoSeed, VersionsDeclaration} from '@nu-art/db-api-shared';

export const BackupDoc_DbKey = 'firestore-backup-status-v2';
type DBKey = typeof BackupDoc_DbKey;
type VersionTypes_BackupDoc = { '1.0.0': DB_BackupDoc };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes_BackupDoc>;
type Dependencies = {};
type UniqueKeys = '_id';
type GeneratedProps = never;

export type DB_BackupDoc = DB_Object<DBKey> & {
	timestamp: number;
	backupPath: string;
	metadataPath: string;
	firebasePath: string;
	metadata: BackupMetaData;
};

export type DatabaseDef_BackupDoc = DB_Prototype<DB_ProtoSeed<DB_BackupDoc, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_BackupDoc = DatabaseDef_BackupDoc['uiType'];

export type ActDetailsDoc = {
	timestamp: number;
	moduleKey: string;
};

export type BackupDoc = ActDetailsDoc & {
	backupPath: string;
	backupId: string;
};

export type FetchBackupDoc = {
	_id: string;
	backupFilePath: string;
	metadataFilePath: string;
	firebaseFilePath: string;
	firestoreSignedUrl: string;
	firebaseSignedUrl: string;
	metadata: BackupMetaData;
};

export type BackupMetaData = {
	collectionsData: {
		dbKey: string;
		numOfDocs: number;
		version: string;
	}[];
	timestamp: number;
};
