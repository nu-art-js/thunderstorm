import {DBDef_EditableTest, DBProto_EditableTest} from '../shared';
import {DBApiConfigV3, ModuleBE_BaseDBV3} from '../../../backend';


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
