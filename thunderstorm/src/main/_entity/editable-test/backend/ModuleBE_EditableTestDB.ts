import {DBApiConfigV3, ModuleBE_BaseDB} from '../../../backend/modules/db-api-gen/ModuleBE_BaseDB';
import {DBDef_EditableTest} from '../shared/db-def';
import {DBProto_EditableTest} from '../shared/types';

type Config = DBApiConfigV3<DBProto_EditableTest> & {
// 	
}

export class ModuleBE_EditableTestDB_Class
	extends ModuleBE_BaseDB<DBProto_EditableTest, Config> {

	constructor() {
		super(DBDef_EditableTest);
	}
}

export const ModuleBE_EditableTestDB = new ModuleBE_EditableTestDB_Class();
