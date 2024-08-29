import {PushKey_BE} from '@thunder-storm/push-pub-sub/backend';
import {PushMessage_FileUploaded} from '../../shared/assets/messages';


export const PushMessageBE_FileUploadStatus = new PushKey_BE<PushMessage_FileUploaded>('file-uploaded');