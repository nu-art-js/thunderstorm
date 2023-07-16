import {
	DBDef,
	OmitDBObject,
	tsValidateArray, tsValidateNumber,
	tsValidateString,
	tsValidateTimestamp,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {DB_BackupDoc} from './backup-types';


export const Validator_BackupDoc: ValidatorTypeResolver<OmitDBObject<DB_BackupDoc>> = {
	timestamp: tsValidateTimestamp(),
	backupPath: tsValidateString(),
	firebasePath: tsValidateString(),
	metadataPath: tsValidateString(),
	metadata: {
		timestamp: tsValidateTimestamp(),
		collectionsData: tsValidateArray({
			collectionName: tsValidateString(),
			numOfDocs: tsValidateNumber(),
			version: tsValidateString()
		})
	}
};

export const DBDef_BackupDocs: DBDef<DB_BackupDoc, keyof DB_BackupDoc> = {
	validator: Validator_BackupDoc,
	dbName: 'firestore-backup-status',
	entityName: 'firestoreBackupStatus',
	versions: ['1.0.0'],
};