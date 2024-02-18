import {DBProto} from '@nu-art/ts-common';
import {DB_EntityDependency} from '../../shared/types';
import {Transaction} from 'firebase-admin/firestore';

export type CanDeleteDBEntitiesProto = {
	__canDeleteEntitiesProto: <T extends DBProto<any>>(type: T['dbName'], itemIds: string[], transaction?: Transaction) => Promise<DB_EntityDependency>
}