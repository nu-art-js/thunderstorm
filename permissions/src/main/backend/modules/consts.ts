import {
	DomainNamespace_PermissionAssignment,
	DomainNamespace_PermissionManagement,
	DuplicateDefaultAccessLevels
} from '../../shared/consts';
import {DefaultDef_Package} from '../../shared/types';
import {
	DBDef_PermissionAccessLevel,
	DBDef_PermissionApi,
	DBDef_PermissionDomain,
	DBDef_PermissionGroup,
	DBDef_PermissionProjects,
	DBDef_PermissionUser
} from '../../shared';

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
			dbNames: [DBDef_PermissionUser.dbName, DBDef_PermissionGroup.dbName]
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
			dbNames: [DBDef_PermissionProjects.dbName, DBDef_PermissionDomain.dbName, DBDef_PermissionAccessLevel.dbName, DBDef_PermissionApi.dbName]
		}
	]
};
