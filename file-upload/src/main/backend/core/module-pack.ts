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
import {ModuleBE_Assets} from '../modules/ModuleBE_Assets';
import {AssetBucketListener} from '../modules/AssetBucketListener';
import {ModulePackBE_PushPubSub} from '@nu-art/push-pub-sub/backend';
import {ModuleBE_AssetUploader} from '../modules/ModuleBE_AssetUploader';
import {createApisForDBModuleV2} from "@nu-art/db-api-generator/backend/ModuleBE_BaseApiV2";


export const ModulePack_Backend_Uploader = [
	...ModulePackBE_PushPubSub,
	ModuleBE_AssetUploader,
	ModuleBE_AssetsTemp, createApisForDBModuleV2(ModuleBE_AssetsTemp),
	ModuleBE_Assets, createApisForDBModuleV2(ModuleBE_Assets),
	AssetBucketListener
];