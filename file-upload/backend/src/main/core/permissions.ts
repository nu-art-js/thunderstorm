import {
	DefaultAccessLevel_Admin,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DefaultDef_Group
} from '@nu-art/permissions-shared';
import {CrudApiDef} from '@nu-art/db-api-shared';
import {ApiDef_Assets, ApiDef_AssetUploader, DBDef_Assets} from '@nu-art/file-upload-shared';
import {Domain_Developer} from '@nu-art/permissions-backend/permissions';
import {DefaultDef_Domain, DefaultDef_Package} from '@nu-art/permissions-backend/types';

const AssetsCrudApiDef = CrudApiDef(DBDef_Assets.dbKey, 'v1');

const Domain_AssetsManager_ID = '993c496c6aaad9c67723034137d26c42';

const _PermissionsDomain_AssetsManager: DefaultDef_Domain = {
	_id: Domain_AssetsManager_ID,
	namespace: 'Assets',
	dbNames: [],
	customApis: [
		{path: AssetsCrudApiDef.deleteAll.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: AssetsCrudApiDef.deleteQuery.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: AssetsCrudApiDef.upsertAll.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: AssetsCrudApiDef.upsert.path, accessLevel: DefaultAccessLevel_Admin.name},
		{path: AssetsCrudApiDef.deleteUnique.path, accessLevel: DefaultAccessLevel_Delete.name},
		{path: AssetsCrudApiDef.queryUnique.path, accessLevel: DefaultAccessLevel_Read.name},
		{path: AssetsCrudApiDef.query.path, accessLevel: DefaultAccessLevel_Read.name},
		{path: ApiDef_Assets.vv1.getReadSignedUrl.path, accessLevel: DefaultAccessLevel_Read.name},
		{path: ApiDef_AssetUploader.vv1.getUploadUrl.path, accessLevel: DefaultAccessLevel_Write.name},
		{
			path: ApiDef_AssetUploader.vv1.processAssetManually.path,
			domainId: Domain_Developer._id,
			accessLevel: DefaultAccessLevel_Write.name
		},
	]
};

export const PermissionsDomain_AssetsManager = Object.freeze(_PermissionsDomain_AssetsManager);

const PermissionsGroupId_AssetsViewer = '0773dcf3b9fbe5e595ef6e2a596b8939';
const PermissionsGroupId_AssetsManager = '3f5037358fba0ae1199047f2fa8add94';

const _PermissionsGroup_AssetsViewer: DefaultDef_Group = {
	_id: PermissionsGroupId_AssetsViewer,
	name: 'Assets Viewer',
	uiLabel: 'Assets Viewer',
	accessLevels: {
		[PermissionsDomain_AssetsManager.namespace]: DefaultAccessLevel_Read.name,
	}
};

const _PermissionsGroup_AssetsManager: DefaultDef_Group = {
	_id: PermissionsGroupId_AssetsManager,
	name: 'Assets Manager',
	uiLabel: 'Assets Manager',
	accessLevels: {
		[PermissionsDomain_AssetsManager.namespace]: DefaultAccessLevel_Delete.name,
	}
};

export const PermissionsGroup_AssetsManager = Object.freeze(_PermissionsGroup_AssetsManager);
export const PermissionsGroup_AssetsViewer = Object.freeze(_PermissionsGroup_AssetsViewer);

export const PermissionsPackage_AssetsManager: DefaultDef_Package = {
	name: PermissionsDomain_AssetsManager.namespace,
	domains: [PermissionsDomain_AssetsManager],
	groups: [PermissionsGroup_AssetsViewer, PermissionsGroup_AssetsManager]
};


