import { tsValidateString } from '@nu-art/ts-common';
const Validator_ModifiableProps = {
    'a': tsValidateString(),
    'b': tsValidateString(),
    'c': tsValidateString(),
    'd': tsValidateString(),
};
const Validator_GeneratedProps = {
// 
};
export const DBDef_EditableTest = {
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
//# sourceMappingURL=db-def.js.map