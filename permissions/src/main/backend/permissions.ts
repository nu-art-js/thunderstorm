import {
	ApiDef_Permissions,
	DBDef_PermissionAccessLevel,
	DBDef_PermissionApi,
	DBDef_PermissionDomain,
	DBDef_PermissionGroup,
	DBDef_PermissionProjects,
	DBDef_PermissionUser
} from '../shared';
import {DefaultDef_Domain, DefaultDef_Group, DefaultDef_Package} from '../shared/types';
import {
	DefaultAccessLevel_Admin,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DuplicateDefaultAccessLevels,
} from '../shared/consts';
import {ApiDefFE_Account} from '@nu-art/user-account';

// export const PermissionsAccessLevel_ReadSelf = Object.freeze({name: 'Read-Self', value: 50});

const Domain_PermissionsDefine_ID = '48d5ace0cbb2a14c8a0ca3773a4a2962';
const Domain_PermissionsAssign_ID = 'ecf9cfe952d034ad8d1f182bbec6e2db';
const Domain_Developer_ID = '1f62a6e2fc4e2cfaa8aa1aa1a45b8c1b';

const _Domain_PermissionsDefine: DefaultDef_Domain = {
	_id: Domain_PermissionsDefine_ID,
	namespace: 'Permissions Define',
	dbNames: [DBDef_PermissionProjects, DBDef_PermissionDomain, DBDef_PermissionApi, DBDef_PermissionAccessLevel].map(dbDef => dbDef.dbName),
	levels: [
		...DuplicateDefaultAccessLevels(Domain_PermissionsDefine_ID),
		// {...PermissionsAccessLevel_ReadSelf, _id: md5(Domain_PermissionsDefine_ID)},
	],
	customApis: [
		{path: ApiDefFE_Account.vv1.refreshSession.path, accessLevel: DefaultAccessLevel_NoAccess.name},
		{path: ApiDef_Permissions.v1.createProject.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: ApiDef_Permissions.v1.toggleStrictMode.path, accessLevel: DefaultAccessLevel_Admin.name},
	]
};

const _Domain_PermissionsAssign: DefaultDef_Domain = {
	_id: Domain_PermissionsAssign_ID,
	namespace: 'Permissions Assign',
	dbNames: [DBDef_PermissionGroup.dbName, DBDef_PermissionUser.dbName],
};

const _Domain_Developer: DefaultDef_Domain = {
	_id: Domain_Developer_ID,
	namespace: 'Developer',
};

export const Domain_PermissionsDefine = Object.freeze(_Domain_PermissionsDefine);
export const Domain_PermissionsAssign = Object.freeze(_Domain_PermissionsAssign);
export const Domain_Developer = Object.freeze(_Domain_Developer);

export const PermissionsPackage_Permissions: DefaultDef_Package = {
	name: 'Permissions',
	domains: [
		Domain_PermissionsDefine,
		Domain_PermissionsAssign,
	],
};

export const PermissionsPackage_Developer: DefaultDef_Package = {
	name: 'Developer',
	domains: [
		Domain_Developer,
	]
};

//Needed?
export const PermissionGroup_PermissionsDefine_NoAccess: DefaultDef_Group = {
	_id: 'cacf1da8ccca1e4dede8859f0d72c55c',
	name: `${Domain_PermissionsDefine.namespace}/No Access`,
	accessLevels: {
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_NoAccess.name,
	},
};

export const PermissionGroup_PermissionsDefine_Viewer: DefaultDef_Group = {
	_id: '0079f39e0f50b70942b8d69bfe1741d5',
	name: `${Domain_PermissionsDefine.namespace}/Viewer`,
	accessLevels: {
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Read.name,
	},
};
export const PermissionGroup_PermissionsDefine_Editor: DefaultDef_Group = {
	_id: '46fb6b35f1d4d11913ce231bd4a42b4b',
	name: `${Domain_PermissionsDefine.namespace}/Editor`,
	accessLevels: {
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Write.name,
	},
};

export const PermissionGroup_PermissionsDefine_Admin: DefaultDef_Group = {
	_id: 'fa260d42ce16a69bc654bf0efd1a2287',
	name: `${Domain_PermissionsDefine.namespace}/Admin`,
	accessLevels: {
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Admin.name,
	},
};

export const PermissionGroup_PermissionsAssign_NoAccess: DefaultDef_Group = {
	_id: 'dafebd8f706d638400e696345c400fc3',
	name: `${Domain_PermissionsAssign.namespace}/No Access`,
	accessLevels: {
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_NoAccess.name,
	},
};

export const PermissionGroup_PermissionsAssign_Viewer: DefaultDef_Group = {
	_id: '5b6d75f5644dd9501551487f9a8748b9',
	name: `${Domain_PermissionsAssign.namespace}/Viewer`,
	accessLevels: {
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Read.name,
	},
};
export const PermissionGroup_PermissionsAssign_Editor: DefaultDef_Group = {
	_id: 'ac5050d644251fa0b95506280a2ebfb3',
	name: `${Domain_PermissionsAssign.namespace}/Editor`,
	accessLevels: {
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Write.name,
	},
};

export const PermissionGroup_PermissionsAssign_Admin: DefaultDef_Group = {
	_id: '232a8bb28f770ac62d4fa74ed594bfeb',
	name: `${Domain_PermissionsAssign.namespace}/Admin`,
	accessLevels: {
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Admin.name,
	},
};

export const PermissionGroups_PermissionsDefine: DefaultDef_Group[] = [
	PermissionGroup_PermissionsDefine_NoAccess,
	PermissionGroup_PermissionsDefine_Viewer,
	PermissionGroup_PermissionsDefine_Editor,
	PermissionGroup_PermissionsDefine_Admin,
];

export const PermissionGroups_PermissionsAssign: DefaultDef_Group[] = [
	PermissionGroup_PermissionsAssign_NoAccess,
	PermissionGroup_PermissionsAssign_Viewer,
	PermissionGroup_PermissionsAssign_Editor,
	PermissionGroup_PermissionsAssign_Admin,
];