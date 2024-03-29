import {DBDef_V3, tsValidateString} from '@nu-art/ts-common';
import {DBProto_EditableTest} from './types';


const Validator_ModifiableProps: DBProto_EditableTest['modifiablePropsValidator'] = {
	'a': tsValidateString(),
	'b': tsValidateString(),
	'c': tsValidateString(),
	'd': tsValidateString(),
};

const Validator_GeneratedProps: DBProto_EditableTest['generatedPropsValidator'] = {
// 
};

export const DBDef_EditableTest: DBDef_V3<DBProto_EditableTest> = {
	modifiablePropsValidator: Validator_ModifiableProps,
	generatedPropsValidator: Validator_GeneratedProps,
	versions: ['1.0.0'],
	dbKey: 'editable-test',
	entityName: 'editable-test',
	frontend: {
		group: 'test',
		name: 'editable-test',
	},
	backend: {
		name: 'editable-test',
	}
};