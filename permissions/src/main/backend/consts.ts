import {SessionData_Permissions} from '../shared/types';
import {SessionKey_BE} from '@nu-art/user-account/backend';
import {SessionData_StrictMode} from './modules/ModuleBE_PermissionsAssert';

export const SessionKey_Permissions_BE = new SessionKey_BE<SessionData_Permissions>('permissions');
export const SessionKey_StrictMode_BE = new SessionKey_BE<SessionData_StrictMode>('strictMode');