import {PushKey_BE} from '@nu-art/push-pub-sub/backend/index';
import {PushMessage_FileUploaded} from '../../shared/assets/messages.js';


export const PushMessageBE_FileUploadStatus = new PushKey_BE<PushMessage_FileUploaded>('file-uploaded');