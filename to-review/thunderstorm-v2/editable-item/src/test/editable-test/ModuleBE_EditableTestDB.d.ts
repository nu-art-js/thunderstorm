import { DBProto_EditableTest } from '@nu-art/thunderstorm-shared/_entity/editable-test/types';
import { DBApiConfigV3, ModuleBE_BaseDB } from '../../modules/db-api-gen/ModuleBE_BaseDB.js';
type Config = DBApiConfigV3<DBProto_EditableTest> & {};
export declare class ModuleBE_EditableTestDB_Class extends ModuleBE_BaseDB<DBProto_EditableTest, Config> {
    constructor();
}
export declare const ModuleBE_EditableTestDB: ModuleBE_EditableTestDB_Class;
export {};
