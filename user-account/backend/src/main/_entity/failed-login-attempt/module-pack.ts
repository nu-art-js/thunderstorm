import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_FailedLoginAttemptDB} from './ModuleBE_FailedLoginAttemptDB.js';

export const ModulePackBE_FailedLoginAttemptDB = [ModuleBE_FailedLoginAttemptDB, createApisForDBModule(ModuleBE_FailedLoginAttemptDB)];