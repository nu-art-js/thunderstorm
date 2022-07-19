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

import {BaseHttpRequest} from '@nu-art/thunderstorm';
import {Auditable, DB_Object, TS_Object} from '@nu-art/ts-common';
import {FileStatus} from '../types';


export type Request_Uploader = {
	name: string
	mimeType: string
	key?: string
	public?: boolean
	metadata?: TS_Object
}

export type BaseUploaderFile = Request_Uploader & {
	feId: string
};

export type DB_Asset = DB_Object & BaseUploaderFile & Auditable & Required<Pick<BaseUploaderFile, 'key'>> & {
	timestamp: number
	ext: string
	md5Hash?: string
	path: string
	bucketName: string
	signedUrl?: {
		url: string,
		validUntil: number
	}
}

export type FileInfo = {
	status: FileStatus
	messageStatus?: string
	progress?: number
	name: string
	request?: BaseHttpRequest<any>
	file?: any
	asset?: DB_Asset
};

export type TempSecureUrl = {
	secureUrl: string
	asset: DB_Asset
}

export type FileUploadResult = { status: FileStatus, asset: DB_Asset };
