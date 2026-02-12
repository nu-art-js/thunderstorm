import { ModuleBE_BaseDB } from '../../modules/db-api-gen/ModuleBE_BaseDB.js';
import { DBDef_EditableTest } from '@nu-art/thunderstorm-shared/_entity/editable-test/db-def';
export class ModuleBE_EditableTestDB_Class extends ModuleBE_BaseDB {
    constructor() {
        super(DBDef_EditableTest);
    }
}
export const ModuleBE_EditableTestDB = new ModuleBE_EditableTestDB_Class();
//# sourceMappingURL=ModuleBE_EditableTestDB.js.map