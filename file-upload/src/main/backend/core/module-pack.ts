/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {ModuleBE_AssetsTemp} from '../modules/ModuleBE_AssetsTemp';
import {ModuleBE_AssetsDB} from '../modules/ModuleBE_AssetsDB';
import {ModuleBE_BucketListener} from '../modules/ModuleBE_BucketListener';
import {ModulePackBE_PushPubSub} from '@nu-art/push-pub-sub/backend';
import {ModuleBE_AssetUploader} from '../modules/ModuleBE_AssetUploader';
import {ModuleBE_AssetsAPI} from '../modules/ModuleBE_AssetsAPI';
import {createApisForDBModuleV3} from '@nu-art/thunderstorm/backend';
import {ModuleBE_AssetsStorage} from '../modules/ModuleBE_AssetsStorage';
import {ModuleBE_AssetsDeleted} from '../modules/ModuleBE_AssetsDeleted';


export const ModulePackBE_FileUploader = [
	...ModulePackBE_PushPubSub,
	ModuleBE_AssetUploader,
	ModuleBE_AssetsTemp, createApisForDBModuleV3(ModuleBE_AssetsTemp),
	ModuleBE_AssetsDeleted,
	ModuleBE_AssetsStorage,
	ModuleBE_AssetsDB, ModuleBE_AssetsAPI,
	ModuleBE_BucketListener
];
