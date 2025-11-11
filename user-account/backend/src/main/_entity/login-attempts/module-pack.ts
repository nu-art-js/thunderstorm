import {createApisForDBModuleV3} from '@nu-art/thunderstorm-backend';
import {ModuleBE_LoginAttemptDB} from './ModuleBE_LoginAttemptDB.js';


export const ModulePackBE_LoginAttemptDB = [ModuleBE_LoginAttemptDB, createApisForDBModuleV3(ModuleBE_LoginAttemptDB)];