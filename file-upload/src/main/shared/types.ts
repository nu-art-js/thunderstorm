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

export const fileUploadedKey = 'file-uploaded';

export enum UploadResult {
	Success = "Success",
	Failure = "Failure"
}

export type Request_GetUploadUrl = {
	name: string
	type: string
	key?: string
}

export type Response_GetUploadUrl = {
	secureUrl: string
	tempId: string
}

export type Api_GetUploadUrl = ApiWithBody<'/v1/upload/get-url', Request_GetUploadUrl, Response_GetUploadUrl>