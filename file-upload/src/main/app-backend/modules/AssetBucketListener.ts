/*
 * A backend boilerplate with example apis
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

import {Firebase_StorageFunction} from "@nu-art/firebase/backend-functions";
import {ObjectMetadata} from "firebase-functions/lib/providers/storage";
import {EventContext} from "firebase-functions";
import {AssetsModuleBE} from "./AssetsModuleBE";

export class AssetBucketListener_Class
	extends Firebase_StorageFunction {

	constructor() {
		super();
	}

	init() {
		super.init();
		// @ts-ignore
		this.logInfo('bucketName', this.config.bucketName);
	}

	async onFinalize(object: ObjectMetadata, context: EventContext): Promise<any> {
		const filePath = object.name;
		await AssetsModuleBE.processAsset(filePath);
		this.logInfo('Object is ', object);
		this.logInfo('Context is ', context);
	}

}

export const AssetBucketListener = new AssetBucketListener_Class();