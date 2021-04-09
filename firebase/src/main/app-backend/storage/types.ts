/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import * as admin from "firebase-admin";
import {CopyResponse} from "@google-cloud/storage";

export type FirebaseType_Storage = admin.storage.Storage;
export type FirebaseType_Metadata = {
	bucket: string;
	cacheControl: string
	componentCount: string
	contentDisposition: string
	contentEncoding: string
	contentLanguage: string
	contentType: string
	customTime: string
	crc32c: string
	etag: string
	generation: string
	id: string
	kmsKeyName: string
	md5Hash: string
	mediaLink: string
	metageneration: string
	name: string
	size: number
	storageClass: string
	timeCreated: number;
	updated: number;

};
export type ReturnType_Metadata = { metadata?: FirebaseType_Metadata };
export type Firebase_CopyResponse = [CopyResponse[0], CopyResponse[1] | undefined]
