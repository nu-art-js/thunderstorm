import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PermissionDomainDB} from './ModuleBE_PermissionDomainDB.js';

export const ModulePackBE_PermissionDomain = [ModuleBE_PermissionDomainDB, createApisForDBModule(ModuleBE_PermissionDomainDB)];