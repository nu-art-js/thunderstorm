import {Module} from '@nu-art/ts-common';
import {ModulePackBE_AccountDB} from './_entity/account/module-pack.js';
import {ModulePackBE_SessionDB} from './_entity/session/module-pack.js';
import {ModuleBE_SecretManager} from '@nu-art/google-services-backend';
import {ModuleBE_AuthGate} from './ModuleBE_AuthGate.js';

const modules: Module[] = [
	ModuleBE_AuthGate,
	...ModulePackBE_AccountDB,
	...ModulePackBE_SessionDB,
	ModuleBE_SecretManager
];

export const ModulePackBE_Accounts = modules;

/** @deprecated Use ModulePackBE_Accounts — SAML has been extracted to @nu-art/saml-backend, password auth to @nu-art/password-auth-backend */
export const ModulePackBE_Accounts_WOSAML = ModulePackBE_Accounts;
