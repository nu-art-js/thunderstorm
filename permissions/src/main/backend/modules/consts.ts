import {
	DomainNamespace_PermissionAssignment,
	DomainNamespace_PermissionManagement,
	DuplicateDefaultAccessLevels
} from '../../shared/consts';
import {DefaultDef_Package} from '../../shared/types';
import {
	DBDef_PermissionAPI,
	DBDef_PermissionAccessLevel,
	DBDef_PermissionDomain,
	DBDef_PermissionGroup,
	DBDef_PermissionProject,
	DBDef_PermissionUser
} from '../_entity';

export const Domain_PermissionAssignment = Object.freeze({
	_id: '1f41541c4514b50140ae62c1f7097029',
	namespace: DomainNamespace_PermissionAssignment
});

export const Permissions_PermissionAssignment: DefaultDef_Package = {
	name: Domain_PermissionAssignment.namespace,
	domains: [
		{
			...Domain_PermissionAssignment,
			levels: [...DuplicateDefaultAccessLevels(Domain_PermissionAssignment._id)],
			dbNames: [DBDef_PermissionUser.dbKey, DBDef_PermissionGroup.dbKey]
		}
	]
};

export const Domain_PermissionManagement = Object.freeze({
	_id: '1f41541c4514b50140ae62c1f7097029',
	namespace: DomainNamespace_PermissionManagement
});

export const Permissions_PermissionManagement: DefaultDef_Package = {
	name: Domain_PermissionManagement.namespace,
	domains: [
		{
			...Domain_PermissionManagement,
			levels: [...DuplicateDefaultAccessLevels(Domain_PermissionManagement._id)],
			dbNames: [DBDef_PermissionProject.dbKey, DBDef_PermissionDomain.dbKey, DBDef_PermissionAccessLevel.dbKey, DBDef_PermissionAPI.dbKey]
		}
	]
};
