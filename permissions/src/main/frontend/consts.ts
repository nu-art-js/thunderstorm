import {SessionData_Permissions} from '../shared/types';
import {SessionKey_FE} from '@nu-art/user-account/frontend';
import {SessionData_StrictMode} from '../backend';

export const SessionKey_Permissions_FE = new SessionKey_FE<SessionData_Permissions>('permissions');
export const SessionKey_StrictMode_FE = new SessionKey_FE<SessionData_StrictMode>('strictMode');
