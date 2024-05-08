import {TS_Object} from '@nu-art/ts-common';
import {DB_EntityDependency} from '../../shared/types';
import {Transaction} from 'firebase-admin/firestore';

export type CanDeleteDBEntitiesV2<AllTypes extends TS_Object, DeleteType extends string = string, ValidateType extends string = string> = {
	__canDeleteEntities: <T extends DeleteType>(type: T, items: (AllTypes[T])[], transaction?: Transaction) => Promise<DB_EntityDependency<ValidateType>>
}