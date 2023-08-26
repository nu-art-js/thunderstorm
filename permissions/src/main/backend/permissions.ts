import {
	DBDef_PermissionAccessLevel,
	DBDef_PermissionApi,
	DBDef_PermissionDomain,
	DBDef_PermissionGroup,
	DBDef_PermissionProjects,
	DBDef_PermissionUser
} from '../shared';
import {DefaultDef_Package} from '../shared/types';
import {DuplicateDefaultAccessLevels} from '../shared/consts';


const Domain_PermissionsDefine_ID = '48d5ace0cbb2a14c8a0ca3773a4a2962';
const Domain_PermissionsAssign_ID = 'ecf9cfe952d034ad8d1f182bbec6e2db';
const Domain_Developer_ID = '1f62a6e2fc4e2cfaa8aa1aa1a45b8c1b';

export const Domain_PermissionsDefine = Object.freeze({
	_id: Domain_PermissionsDefine_ID,
	namespace: 'Permissions Define',
	levels: [...DuplicateDefaultAccessLevels(Domain_PermissionsDefine_ID)],
	dbName: [DBDef_PermissionProjects, DBDef_PermissionDomain, DBDef_PermissionApi, DBDef_PermissionAccessLevel].map(dbDef=>dbDef.dbName),
});

export const Domain_PermissionsAssign = Object.freeze({
	_id: Domain_PermissionsAssign_ID,
	namespace: 'Permissions Assign',
	levels: [...DuplicateDefaultAccessLevels(Domain_PermissionsAssign_ID)],
	dbName: [DBDef_PermissionGroup.dbName,DBDef_PermissionUser.dbName],
});

export const Domain_Developer = Object.freeze({
	_id: Domain_Developer_ID,
	namespace: 'Developer',
	levels: [...DuplicateDefaultAccessLevels(Domain_Developer_ID)],
});

export const PermissionsPackage_Permissions: DefaultDef_Package = {
	name: 'Permissions',
	domains: [
		Domain_PermissionsDefine,
		Domain_PermissionsAssign,
	]
};

export const PermissionsPackage_Developer: DefaultDef_Package = {
	name: 'Developer',
	domains: [
		Domain_Developer,
	]
};