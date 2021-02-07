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

import {ApiWithBody} from "@nu-art/thunderstorm"
import {DB_Object} from "@nu-art/firebase";
import {AuditBy} from "@nu-art/ts-common";
import {MessageType} from "@nu-art/push-pub-sub";

export const fileUploadedKey = 'file-uploaded';
export type Push_FileUploaded = MessageType<'file-uploaded', { feId: string }, { message: string, result: string, cause?: Error }>;

export enum UploadResult {
	Success = "Success",
	Failure = "Failure"
}

export type Request_Uploader = {
	name: string
	mimeType: string
	key?: string
	public?: boolean
}

export type BaseUploaderFile = Request_Uploader & {
	feId: string
};

export type DB_Temp_File = DB_Object & BaseUploaderFile & Required<Pick<BaseUploaderFile, 'key'>> & {
	path: string
	_audit: AuditBy
	bucketName: string
}
export type Request_GetUploadUrl = BaseUploaderFile[]

export type TempSecureUrl = {
	secureUrl: string
	tempDoc: DB_Temp_File
}

export type Api_GetUploadUrl = ApiWithBody<'/v1/upload/get-url', BaseUploaderFile[], TempSecureUrl[]>