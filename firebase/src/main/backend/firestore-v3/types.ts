import {DBProto} from '@nu-art/ts-common';
import {DB_EntityDependencyV2} from '../../shared/types';
import {Transaction} from 'firebase-admin/firestore';

export type CanDeleteDBEntitiesProto = {
	__canDeleteEntitiesProto: <T extends DBProto<any>>(type: T['dbKey'], itemIds: string[], transaction?: Transaction) => Promise<DB_EntityDependencyV2>
}