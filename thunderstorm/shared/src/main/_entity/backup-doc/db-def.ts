import {Database} from '@nu-art/db-api-shared';
import {tsValidateArray, tsValidateNumber, tsValidateString, tsValidateTimestamp} from '@nu-art/ts-common';
import {DatabaseDef_BackupDoc} from './types.js';


const Validator_ModifiableProps: DatabaseDef_BackupDoc['modifiablePropsValidator'] = {
	timestamp: tsValidateTimestamp(),
	backupPath: tsValidateString(),
	firebasePath: tsValidateString(),
	metadataPath: tsValidateString(),
	metadata: {
		timestamp: tsValidateTimestamp(),
		collectionsData: tsValidateArray({
			dbKey: tsValidateString(),
			numOfDocs: tsValidateNumber(),
			version: tsValidateString()
		})
	}
};

const Validator_GeneratedProps: DatabaseDef_BackupDoc['generatedPropsValidator'] = {};

export const DBDef_BackupDoc: Database<DatabaseDef_BackupDoc> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'firestore-backup-status-v2',
	entityName: 'firestoreBackupStatus',
	frontend: {
		group: 'app',
		name: 'firestore-backup-status-v2'
	},
	backend: {
		name: 'backup-doc'
	}
};