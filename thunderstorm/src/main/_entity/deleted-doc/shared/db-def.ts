import {DBDef_V3, tsValidateString, tsValidateUniqueId} from '@nu-art/ts-common';
import {DBProto_DeletedDoc} from './types';


const Validator_ModifiableProps: DBProto_DeletedDoc['modifiablePropsValidator'] = {
	__docId: tsValidateUniqueId,
	__collectionName: tsValidateString(),
};

const Validator_GeneratedProps: DBProto_DeletedDoc['generatedPropsValidator'] = {};

export const DBDef_DeletedDoc: DBDef_V3<DBProto_DeletedDoc> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: '__deleted__docs',
	entityName: 'DeletedDoc',
	frontend: {
		group: 'ts-default',
		name: 'deleted-doc'
	},
	backend: {
		name: '__deleted__docs'
	}
};