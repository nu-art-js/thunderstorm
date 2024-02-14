import {ModuleBE_EditableTestDB} from './ModuleBE_EditableTestDB';
import {createApisForDBModuleV3} from '../../../backend';


export const ModulePackBE_EditableTest = [ModuleBE_EditableTestDB, createApisForDBModuleV3(ModuleBE_EditableTestDB)];