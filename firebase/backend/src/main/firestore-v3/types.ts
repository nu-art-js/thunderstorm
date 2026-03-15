import {DB_Prototype} from '@nu-art/db-api-shared';
import {DB_EntityDependencyV2} from '@nu-art/firebase-shared';
import {Transaction} from 'firebase-admin/firestore';

export type CanDeleteDBEntitiesProto = {
	__canDeleteEntitiesProto: <T extends DB_Prototype>(type: T['dbKey'], itemIds: string[], transaction?: Transaction) => Promise<DB_EntityDependencyV2>
}