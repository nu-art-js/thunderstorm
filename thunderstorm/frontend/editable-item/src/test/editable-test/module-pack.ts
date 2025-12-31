import {ModuleBE_EditableTestDB} from './ModuleBE_EditableTestDB.js';
import {createApisForDBModuleV3} from '../../index.js';


export const ModulePackBE_EditableTest = [ModuleBE_EditableTestDB, createApisForDBModuleV3(ModuleBE_EditableTestDB)];