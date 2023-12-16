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

import {ModuleBE_AccountDB} from '../modules/ModuleBE_AccountDB';
import {ModuleBE_SessionDB} from '../modules/ModuleBE_SessionDB';
import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';


export const ModulePackBE_Accounts: Module[] = [
	ModuleBE_AccountDB, createApisForDBModuleV3(ModuleBE_AccountDB),
	ModuleBE_SessionDB
];

export * from '../modules/ModuleBE_AccountDB';
export * from '../modules/ModuleBE_SessionDB';
export * from '../modules/ModuleBE_SAML';

