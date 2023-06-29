import {CanDeleteDBEntities} from '@nu-art/db-api-generator/backend';
import {PermissionTypes} from '../../shared/types';

export type CanDeletePermissionEntities<DeleteType extends keyof PermissionTypes, ValidateType extends keyof PermissionTypes> =
	CanDeleteDBEntities<PermissionTypes, DeleteType, ValidateType>