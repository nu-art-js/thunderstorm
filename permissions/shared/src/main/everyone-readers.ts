import {hashToUniqueId} from '@nu-art/db-api-shared';
import type {DatabaseDef_AccessGroup} from './_entity/access-group/types.js';

/**
 * The 'everyone can read' bucket. Every account is a member (added on registration, login and project
 * setup). Public-read entities put it in __access.readers. Only the bootstrap system service account writes it.
 */
export const GroupId_EveryoneReaders = hashToUniqueId<DatabaseDef_AccessGroup['dbKey']>('group/everyone-readers');
