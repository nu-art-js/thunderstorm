import {DBDef} from '../../_main';
import {DBType_Test1} from './types';


const Validator_TestType = {
	aString: undefined,
	aNumber: undefined,
	aBoolean: undefined,
	anObject: undefined,
	anArray: undefined,
};

export const DBDef_TestType: DBDef<DBType_Test1> = {
	validator: Validator_TestType,
	dbName: 'tests--collection-test-1',
	entityName: 'collection-test-1',
	versions: ['1.0.0'],
};