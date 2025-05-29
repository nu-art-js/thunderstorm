import {SessionData_Permissions} from '../shared/types';
import {SessionData_StrictMode} from '../backend';
import {SessionKey_FE} from '@nu-art/user-account/_entity/session/frontend/ModuleFE_Session';

export const SessionKey_Permissions_FE = new SessionKey_FE<SessionData_Permissions>('permissions');
export const SessionKey_StrictMode_FE = new SessionKey_FE<SessionData_StrictMode>('strictMode');
