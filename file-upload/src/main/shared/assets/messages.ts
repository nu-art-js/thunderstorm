import {PushMessage} from '@thunder-storm/push-pub-sub';
import {DB_Asset} from './types1';


export const PushKey_FileUploaded = 'file-uploaded';

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

type FileUploadResult = { status: FileStatus, asset: DB_Asset };
export type PushMessage_FileUploaded = PushMessage<'file-uploaded', { feId: string }, FileUploadResult>;
