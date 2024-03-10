import {DBApiConfigV3, ModuleBE_BaseDBV3} from '../../../backend/modules/db-api-gen/ModuleBE_BaseDBV3';
import {DBDef_EditableTest} from '../shared/db-def';
import {DBProto_EditableTest} from '../shared/types';

type Config = DBApiConfigV3<DBProto_EditableTest> & {
// 	
}

export class ModuleBE_EditableTestDB_Class
	extends ModuleBE_BaseDBV3<DBProto_EditableTest, Config> {

	constructor() {
		super(DBDef_EditableTest);
	}
}

export const ModuleBE_EditableTestDB = new ModuleBE_EditableTestDB_Class();
