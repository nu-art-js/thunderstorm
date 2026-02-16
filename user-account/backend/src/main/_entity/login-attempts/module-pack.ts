import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_LoginAttemptDB} from './ModuleBE_LoginAttemptDB.js';

export const ModulePackBE_LoginAttemptDB = [ModuleBE_LoginAttemptDB, createApisForDBModule(ModuleBE_LoginAttemptDB)];