import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';
import {ModuleBE_FailedLoginAttemptDB} from './ModuleBE_FailedLoginAttemptDB';


export const ModulePackBE_FailedLoginAttemptDB = [ModuleBE_FailedLoginAttemptDB, createApisForDBModuleV3(ModuleBE_FailedLoginAttemptDB)];