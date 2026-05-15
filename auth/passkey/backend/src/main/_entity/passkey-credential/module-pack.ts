/*
 * @nu-art/passkey-backend - Passkey/WebAuthn backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createApisForDBModule} from '@nu-art/db-api-backend';
import {ModuleBE_PasskeyCredentialDB} from './ModuleBE_PasskeyCredentialDB.js';

export const ModulePackBE_PasskeyCredentialDB = [ModuleBE_PasskeyCredentialDB, createApisForDBModule(ModuleBE_PasskeyCredentialDB)];
