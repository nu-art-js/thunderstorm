import {DBDef, OmitDBObject, tsValidateString, tsValidateTimestamp, ValidatorTypeResolver} from '@nu-art/ts-common';
import {DB_BackupDoc} from './backup-types';


export const Validator_BackupDoc: ValidatorTypeResolver<OmitDBObject<DB_BackupDoc>> = {
	timestamp: tsValidateTimestamp(),
	backupPath: tsValidateString(),
	metadataPath: tsValidateString()
};

export const DBDef_BackupDocs: DBDef<DB_BackupDoc, keyof DB_BackupDoc> = {
	validator: Validator_BackupDoc,
	dbName: 'firestore-backup-status',
	entityName: 'firestoreBackupStatus',
	versions: ['1.0.0'],
};