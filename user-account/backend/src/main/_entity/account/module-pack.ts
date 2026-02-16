import {Module} from '@nu-art/ts-common';
import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_AccountDB} from './ModuleBE_AccountDB.js';
import {ModuleBE_SAML} from './ModuleBE_SAML.js';

export const ModulePackBE_AccountDB: Module[] = [
	ModuleBE_AccountDB, createApisForDBModule(ModuleBE_AccountDB),
];

export const ModulePackBE_SAML: Module[] = [ModuleBE_SAML];