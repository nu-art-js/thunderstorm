import {SessionData_Permissions} from '../shared/types';
import {SessionKey_BE} from '@nu-art/user-account/backend';

export const SessionKey_Permissions_BE = new SessionKey_BE<SessionData_Permissions>('permissions');