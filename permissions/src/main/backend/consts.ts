import {SessionData_Permissions} from '../shared/types';
import {SessionKey_BE} from '@nu-art/user-account/backend';
import {SessionData_StrictMode} from './modules/ModuleBE_PermissionsAssert';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {TypedMap} from '@nu-art/ts-common';

export const SessionKey_Permissions_BE = new SessionKey_BE<SessionData_Permissions>('permissions');
export const SessionKey_StrictMode_BE = new SessionKey_BE<SessionData_StrictMode>('strictMode');

export const MemKey_UserPermissions = new MemKey<TypedMap<number>>('user-permissions'); //[domainId]: access level numerical value