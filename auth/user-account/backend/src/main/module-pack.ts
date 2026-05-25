import {Module} from '@nu-art/ts-common';
import {ModulePackBE_AccountDB} from './_entity/account/module-pack.js';
import {ModulePackBE_SessionDB} from './_entity/session/module-pack.js';
import {ModulePackBE_BootstrapTokenDB} from './_entity/bootstrap-token/module-pack.js';
import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';

const modules: Module[] = [
	...ModulePackBE_AccountDB,
	...ModulePackBE_SessionDB,
	...ModulePackBE_BootstrapTokenDB,
	ModuleBE_SecretManager
];

export const ModulePackBE_Accounts = modules;

/** @deprecated Use ModulePackBE_Accounts — SAML has been extracted to @nu-art/saml-backend, password auth to @nu-art/password-auth-backend */
export const ModulePackBE_Accounts_WOSAML = ModulePackBE_Accounts;
