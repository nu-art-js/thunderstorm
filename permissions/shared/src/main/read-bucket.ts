import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup} from './_entity/access-group/types.js';

/**
 * The read bucket: every account is a member (added on registration and login, and backfilled by the
 * permissions read-bucket setup action). Public-read entities put it in __access.readers.
 * Only the bootstrap system service account writes it.
 */
export const GroupId_ReadBucket = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/read-bucket');
