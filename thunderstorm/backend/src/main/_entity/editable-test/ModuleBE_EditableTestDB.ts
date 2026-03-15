import {DatabaseDef_EditableTest} from '@nu-art/thunderstorm-shared/_entity/editable-test/types';
import {DBApiConfigV3, ModuleBE_BaseDB} from '../../modules/db-api-gen/ModuleBE_BaseDB.js';
import {DBDef_EditableTest} from '@nu-art/thunderstorm-shared/_entity/editable-test/db-def';

type Config = DBApiConfigV3<DatabaseDef_EditableTest> & {
// 	
}

export class ModuleBE_EditableTestDB_Class
	extends ModuleBE_BaseDB<DatabaseDef_EditableTest, Config> {

	constructor() {
		super(DBDef_EditableTest);
	}
}

export const ModuleBE_EditableTestDB = new ModuleBE_EditableTestDB_Class();
