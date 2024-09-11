/*
 * User secured registration and login management system..
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Module} from '@nu-art/ts-common';
import {
	ModulePackBE_AccountDB,
	ModulePackBE_FailedLoginAttemptDB,
	ModulePackBE_SAML,
	ModulePackBE_SessionDB
} from './_entity';
import {ModuleBE_SecretManager} from '@nu-art/google-services/backend/modules/ModuleBE_SecretManager';

export const ModulePackBE_Accounts: Module[] = [
	...ModulePackBE_AccountDB,
	...ModulePackBE_SAML,
	...ModulePackBE_SessionDB,
	...ModulePackBE_FailedLoginAttemptDB,
	ModuleBE_SecretManager
];
