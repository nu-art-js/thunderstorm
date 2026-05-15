/*
 * @nu-art/passkey-frontend - Passkey/WebAuthn frontend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {ModuleFE_PasskeyAuth} from './ModuleFE_PasskeyAuth.js';
import {ModuleFE_PasskeyCredentialDB} from './_entity/passkey-credential/ModuleFE_PasskeyCredentialDB.js';

export const ModulePackFE_Passkey: Module[] = [ModuleFE_PasskeyAuth, ModuleFE_PasskeyCredentialDB];
