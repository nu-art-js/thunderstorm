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
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
} from '../shared/consts';
import {ApiDefBE_Account, ApiDefFE_Account, DBDef_Accounts} from '@nu-art/user-account';
import {defaultValueResolverV2, PermissionKey_BE} from './PermissionKey_BE';
import {PermissionKey_DeveloperAdmin, PermissionKey_DeveloperViewer, PermissionKey_DeveloperWriter} from '../shared/permission-keys';
import {ApiDef_UpgradeCollection} from '@nu-art/thunderstorm/shared/upgrade-collection';
import {ApiDef_ActionProcessing} from '@nu-art/thunderstorm/shared/action-processor';
import {ApiDef_SyncEnvV2} from '@nu-art/thunderstorm';

// export const PermissionsAccessLevel_ReadSelf = Object.freeze({name: 'Read-Self', value: 50});

const Domain_PermissionsDefine_ID = '48d5ace0cbb2a14c8a0ca3773a4a2962';
const Domain_PermissionsAssign_ID = 'ecf9cfe952d034ad8d1f182bbec6e2db';
const Domain_AccountManagement_ID = 'a02fd6cef8ccae193ad7357d596131e4';
const Domain_Developer_ID = '1f62a6e2fc4e2cfaa8aa1aa1a45b8c1b';

const _Domain_PermissionsDefine: DefaultDef_Domain = {
	_id: Domain_PermissionsDefine_ID,
	namespace: 'Permissions Define',
	dbNames: [DBDef_PermissionProjects, DBDef_PermissionDomain, DBDef_PermissionApi, DBDef_PermissionAccessLevel].map(dbDef => dbDef.dbName),
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

const _Domain_AccountManagement: DefaultDef_Domain = {
	_id: Domain_AccountManagement_ID,
	namespace: 'Account Management',
	dbNames: [DBDef_Accounts.dbName],
	customApis: [
		{path: ApiDefBE_Account.vv1.createAccount.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: ApiDefBE_Account.vv1.createToken.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: ApiDefBE_Account.vv1.getSessions.path, accessLevel: DefaultAccessLevel_Admin.name},
	]
};

export const PermissionKeyBE_DeveloperViewer = new PermissionKey_BE(PermissionKey_DeveloperViewer, () => defaultValueResolverV2(Domain_Developer._id, DefaultAccessLevel_Read.name));
export const PermissionKeyBE_DeveloperEditor = new PermissionKey_BE(PermissionKey_DeveloperWriter, () => defaultValueResolverV2(Domain_Developer._id, DefaultAccessLevel_Write.name));
export const PermissionKeyBE_DeveloperAdmin = new PermissionKey_BE(PermissionKey_DeveloperAdmin, () => defaultValueResolverV2(Domain_Developer._id, DefaultAccessLevel_Admin.name));

const _Domain_Developer: DefaultDef_Domain = {
	_id: Domain_Developer_ID,
	namespace: 'Developer',
	permissionKeys: [
		PermissionKeyBE_DeveloperViewer,
		PermissionKeyBE_DeveloperEditor,
		PermissionKeyBE_DeveloperAdmin,
	],
	customApis: [
		{path: ApiDef_UpgradeCollection.vv1.upgrade.path, accessLevel: DefaultAccessLevel_Delete.name},
		{path: ApiDef_ActionProcessing.vv1.list.path, accessLevel: DefaultAccessLevel_Read.name},
		{path: ApiDef_ActionProcessing.vv1.execute.path, accessLevel: DefaultAccessLevel_Admin.name},

		{path: ApiDef_SyncEnvV2.vv1.fetchBackupMetadata.path, accessLevel: DefaultAccessLevel_Read.name},
		{path: ApiDef_SyncEnvV2.vv1.createBackup.path, accessLevel: DefaultAccessLevel_Write.name},
		{path: ApiDef_SyncEnvV2.vv1.syncFromEnvBackup.path, accessLevel: DefaultAccessLevel_Write.name},
		{path: ApiDef_SyncEnvV2.vv1.syncFirebaseFromBackup.path, accessLevel: DefaultAccessLevel_Write.name},
		{path: ApiDef_SyncEnvV2.vv1.syncToEnv.path, accessLevel: DefaultAccessLevel_Admin.name},

	]
};

export const Domain_PermissionsDefine = Object.freeze(_Domain_PermissionsDefine);
export const Domain_PermissionsAssign = Object.freeze(_Domain_PermissionsAssign);
export const Domain_AccountManagement = Object.freeze(_Domain_AccountManagement);
export const Domain_Developer = Object.freeze(_Domain_Developer);

export const PermissionsPackage_Permissions: DefaultDef_Package = {
	name: 'Permissions',
	domains: [
		Domain_AccountManagement,
		Domain_PermissionsDefine,
		Domain_PermissionsAssign,
	],
};

export const PermissionsPackage_Developer: DefaultDef_Package = {
	name: 'Developer',
	domains: [
		Domain_Developer,
	],
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
		[Domain_PermissionsDefine.namespace]: DefaultAccessLevel_Delete.name,
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
		[Domain_PermissionsAssign.namespace]: DefaultAccessLevel_Delete.name,
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