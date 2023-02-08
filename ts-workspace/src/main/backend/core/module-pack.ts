/*
 * Live-Docs will allow you to add and edit tool-tips from within your app...
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

import {createApisForDBModule} from '@nu-art/db-api-generator/backend/DB_ApiGenerator';
import {Module} from '@nu-art/ts-common';
import {ModuleBE_Workspace} from '../modules/ModuleBE_Workspace';


export const ModulePack_Backend_TSWorkspace: Module[] = [
	ModuleBE_Workspace, createApisForDBModule(ModuleBE_Workspace),
];

export * from '../modules/ModuleBE_Workspace';

