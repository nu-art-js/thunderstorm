import {BaseDB_ModuleBE} from '../../_main';
import {DBType_Test1} from './types';
import {DBDef_TestType} from './db-def';


export class ModuleTest_DBModule_Test1_Class
	extends BaseDB_ModuleBE<DBType_Test1> {

	constructor() {
		super(DBDef_TestType);
	}
}

export const ModuleTest_DBModule_Test1 = new ModuleTest_DBModule_Test1_Class();