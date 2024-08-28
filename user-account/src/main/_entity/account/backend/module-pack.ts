import {Module} from '@thunder-storm/common';
import {createApisForDBModuleV3} from '@thunder-storm/core/backend';
import {ModuleBE_AccountDB} from './ModuleBE_AccountDB';
import {ModuleBE_SAML} from './ModuleBE_SAML';

export const ModulePackBE_AccountDB: Module[] = [
	ModuleBE_AccountDB, createApisForDBModuleV3(ModuleBE_AccountDB),
];

export const ModulePackBE_SAML: Module[] = [ModuleBE_SAML];