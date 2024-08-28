import {createApisForDBModuleV3} from '@thunder-storm/core/backend';
import {ModuleBE_PermissionDomainDB} from './ModuleBE_PermissionDomainDB';


export const ModulePackBE_PermissionDomain = [ModuleBE_PermissionDomainDB, createApisForDBModuleV3(ModuleBE_PermissionDomainDB)];