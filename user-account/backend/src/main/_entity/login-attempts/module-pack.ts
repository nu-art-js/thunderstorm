import {createApisForDBModuleV3} from '@nu-art/thunder-db-api-backend';
import {ModuleBE_LoginAttemptDB} from './ModuleBE_LoginAttemptDB.js';


export const ModulePackBE_LoginAttemptDB = [ModuleBE_LoginAttemptDB, createApisForDBModuleV3(ModuleBE_LoginAttemptDB)];