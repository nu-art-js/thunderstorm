import {DBDef_V3, tsValidateArray, tsValidateNumber, tsValidateString, tsValidateTimestamp} from '@nu-art/ts-common';
import {DBProto_BackupDoc} from './types';

const Validator_ModifiableProps: DBProto_BackupDoc['modifiablePropsValidator'] = {
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

const Validator_GeneratedProps: DBProto_BackupDoc['generatedPropsValidator'] = {};

export const DBDef_BackupDoc: DBDef_V3<DBProto_BackupDoc> = {
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