import {filterInstances} from '@nu-art/ts-common';
import {ModuleBE_BaseDB} from '@nu-art/thunderstorm/backend';
import {ModulePackBE_Messaging} from './module-pack';
import {DefaultDef_Group, DefaultDef_Package} from '@nu-art/permissions/shared/types';
import {
	DefaultAccessLevel_Admin,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DuplicateDefaultAccessLevels
} from '@nu-art/permissions/shared/consts';

export const DomainNamespace_Messaging = 'Messaging';
export const Domain_Messaging = Object.freeze({
	_id: '2de76d8ea55ba2fc8a7833520ab11339',
	namespace: DomainNamespace_Messaging
});

export const Permissions_Messaging: DefaultDef_Package = {
	name: Domain_Messaging.namespace,
	domains: [
		{
			...Domain_Messaging,
			levels: [...DuplicateDefaultAccessLevels(Domain_Messaging._id)],
			dbNames: [
				...filterInstances(ModulePackBE_Messaging as ModuleBE_BaseDB<any>[])
					.filter(module => module.dbDef && module.dbDef.dbKey)
					.map(module => module.dbDef),
			].map(dbDef => dbDef.dbKey)
		}
	]
};

export const PermissionGroups_Messaging_Viewer: DefaultDef_Group = {
	_id: 'e6bfc302f7ac81b8c61c97c4e0983b0f',
	name: `${Domain_Messaging.namespace}/Read`,
	accessLevels: {
		[Domain_Messaging.namespace]: DefaultAccessLevel_Read.name,
	},
};

export const PermissionGroups_Messaging_Editor: DefaultDef_Group = {
	_id: 'd9505032de4ae9f1036525676d689e1f',
	name: `${Domain_Messaging.namespace}/Editor`,
	accessLevels: {
		[Domain_Messaging.namespace]: DefaultAccessLevel_Write.name,
	},
};

export const PermissionGroups_Messaging_Delete: DefaultDef_Group = {
	_id: 'e0550d1113874a31e2e3223f258e1340',
	name: `${Domain_Messaging.namespace}/Delete`,
	accessLevels: {
		[Domain_Messaging.namespace]: DefaultAccessLevel_Delete.name,
	},
};

export const PermissionGroups_Messaging_Admin: DefaultDef_Group = {
	_id: '89ebc208e794028ebbbf9ea91c508603',
	name: `${Domain_Messaging.namespace}/Admin`,
	accessLevels: {
		[Domain_Messaging.namespace]: DefaultAccessLevel_Admin.name,
	},
};

export const PermissionGroups_Messaging: DefaultDef_Group[] = [
	PermissionGroups_Messaging_Viewer,
	PermissionGroups_Messaging_Editor,
	PermissionGroups_Messaging_Delete,
	PermissionGroups_Messaging_Admin,
];