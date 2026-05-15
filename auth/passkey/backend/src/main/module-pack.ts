/*
 * @nu-art/passkey-backend - Passkey/WebAuthn backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {ModuleBE_PasskeyAuth} from './modules/ModuleBE_PasskeyAuth.js';
import {ModulePackBE_PasskeyCredentialDB} from './_entity/passkey-credential/module-pack.js';

export const ModulePackBE_Passkey: Module[] = [
	ModuleBE_PasskeyAuth,
	...ModulePackBE_PasskeyCredentialDB,
];
