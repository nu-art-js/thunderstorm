import {DB_Prototype} from '@nu-art/db-api-shared';
import {Dispatcher} from '@nu-art/ts-common';
import {Transaction} from 'firebase-admin/firestore';
import {DBEntityDependencies} from '../../shared.js';

export interface EntityDependencyCollection {
	__collectEntityDependencies: <T extends DB_Prototype>(type: T['dbKey'], itemIds: string[], transaction?: Transaction) => Promise<DBEntityDependencies | undefined>;
}

export const dispatch_CollectEntityDependencies = new Dispatcher<EntityDependencyCollection, '__collectEntityDependencies'>('__collectEntityDependencies');