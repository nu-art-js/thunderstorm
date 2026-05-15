import {Module} from '@nu-art/ts-common';
import {ModuleBE_PasswordAuth} from './ModuleBE_PasswordAuth.js';
import {ModulePackBE_LoginAttemptDB} from './_entity/login-attempts/module-pack.js';
import {ModulePackBE_FailedLoginAttemptDB} from './_entity/failed-login-attempt/module-pack.js';
import {ModulePackBE_PasswordCredentialDB} from './_entity/password-credentials/module-pack.js';

export const ModulePackBE_PasswordAuth: Module[] = [
	ModuleBE_PasswordAuth,
	...ModulePackBE_LoginAttemptDB,
	...ModulePackBE_FailedLoginAttemptDB,
	...ModulePackBE_PasswordCredentialDB,
];
