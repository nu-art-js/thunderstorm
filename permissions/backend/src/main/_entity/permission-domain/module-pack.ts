import {createApisForDBModuleV3} from '@nu-art/thunderstorm-backend';
import {ModuleBE_PermissionDomainDB} from './ModuleBE_PermissionDomainDB.js';


export const ModulePackBE_PermissionDomain = [ModuleBE_PermissionDomainDB, createApisForDBModuleV3(ModuleBE_PermissionDomainDB)];