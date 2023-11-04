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

import {FileUploadResult} from '.';
import {MessageDef} from '@nu-art/push-pub-sub';


export const PushKey_FileUploaded = 'file-uploaded';

export type Push_FileUploaded = MessageDef<'file-uploaded', { feId: string }, FileUploadResult>;

export enum FileStatus {
	Idle = 'Idle',
	ObtainingUrl = 'ObtainingUrl',
	UrlObtained = 'UrlObtained',
	UploadingFile = 'UploadingFile',
	WaitingForProcessing = 'WaitingForProcessing',
	Processing = 'Processing',
	PostProcessing = 'PostProcessing',
	Completed = 'Completed',
	ErrorWhileProcessing = 'ErrorWhileProcessing',
	ErrorMakingPublic = 'ErrorMakingPublic',
	ErrorNoValidator = 'ErrorNoValidator',
	ErrorNoConfig = 'ErrorNoConfig',
	ErrorRetrievingMetadata = 'ErrorRetrievingMetadata',
	Error = 'Error'
}

export interface OnFileStatusChanged {
	__onFileStatusChanged: (id: string) => void;
}