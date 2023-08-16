import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';
import {TS_Object} from '@nu-art/ts-common';
import {HeaderKey} from '@nu-art/thunderstorm/backend';
import {HeaderKey_SessionId} from '../../shared';

export const MemKey_AccountEmail = new MemKey<string>('accounts--email', true);
export const MemKey_AccountId = new MemKey<string>('accounts--id', true);
export const MemKey_SessionData = new MemKey<TS_Object>('session-data', true);
export const Header_SessionId = new HeaderKey(HeaderKey_SessionId, 403);
