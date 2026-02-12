import {DBProto_EditableTest} from '@nu-art/storm-shared';
import {DBApiConfigV3, ModuleBE_BaseDB} from '../../modules/db-api-gen/ModuleBE_BaseDB.js';
import {DBDef_EditableTest} from '@nu-art/storm-shared';

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
