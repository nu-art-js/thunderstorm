import {PermissionTypes} from '../../shared/types';
import {CanDeleteDBEntities} from '@nu-art/thunderstorm/backend';

export type CanDeletePermissionEntities<DeleteType extends keyof PermissionTypes, ValidateType extends keyof PermissionTypes> =
	CanDeleteDBEntities<PermissionTypes, DeleteType, ValidateType>