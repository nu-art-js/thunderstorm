import {SessionKey_BE} from '@nu-art/user-account-backend';
import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import type {DBPointer} from '@nu-art/ts-common';
import {SessionData_StrictMode} from '@nu-art/permissions-shared';

export const SessionKey_StrictMode_BE = new SessionKey_BE<SessionData_StrictMode>('strictMode');

export const MemKey_UserScopePermissions = new MemKey<string[]>('user-scope-permissions');
export const MemKey_UserEntityContexts = new MemKey<DBPointer[]>('user-entity-contexts');
export const MemKey_ServiceAccountId = new MemKey<string>('service-account-id');
