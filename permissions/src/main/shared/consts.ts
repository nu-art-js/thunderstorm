import {md5} from '@thunder-storm/common';
import {DefaultDef_AccessLevel, PermissionKey, PreDBAccessLevel} from './types';


export const Prefix_PermissionKey = 'permission-key--';
export const DomainNamespace_PermissionAssignment = 'Permissions Assignment';
export const DomainNamespace_PermissionManagement = 'Permissions Management';
export const DefaultAccessLevel_NoAccess = Object.freeze({name: 'No-Access', value: 0});
export const DefaultAccessLevel_Read = Object.freeze({name: 'Read', value: 200});
export const DefaultAccessLevel_Write = Object.freeze({name: 'Write', value: 400});
export const DefaultAccessLevel_Delete = Object.freeze({name: 'Delete', value: 600});
export const DefaultAccessLevel_Admin = Object.freeze({name: 'Admin', value: 1000});

//UI access levels
export const DefaultUIAccessLevel_NoAccess = Object.freeze({name: 'Ui-No-Access', value: 0});
export const DefaultUIAccessLevel_Beta = Object.freeze({name: 'Beta', value: 1});
export const DefaultUIAccessLevel_Release = Object.freeze({name: 'Release', value: 2});

export const defaultUIAccessLevels = [
	DefaultUIAccessLevel_NoAccess,
	DefaultUIAccessLevel_Beta,
	DefaultUIAccessLevel_Release
];

export const defaultAccessLevels = [
	DefaultAccessLevel_NoAccess,
	DefaultAccessLevel_Read,
	DefaultAccessLevel_Write,
	DefaultAccessLevel_Delete,
	DefaultAccessLevel_Admin,
];

export const DuplicateDefaultAccessLevels = (seed: string): DefaultDef_AccessLevel[] => {
	return CreateDefaultAccessLevels(seed, [
		{...DefaultAccessLevel_NoAccess},
		{...DefaultAccessLevel_Read},
		{...DefaultAccessLevel_Write},
		{...DefaultAccessLevel_Delete},
		{...DefaultAccessLevel_Admin},
	]);
};

export const CreateDefaultAccessLevels = (seed: string, accessLevels: PreDBAccessLevel[]): DefaultDef_AccessLevel[] => {
	return accessLevels.map(level => ({...level, _id: md5(`${seed}${level.name}`), uiLabel: level.name}));
};

const generateDefaultKeyName = (namespace: string, accessLevelName: string) => {
	return `${defaultPermissionKeySuffix}--${namespace}--${accessLevelName}`;
};

export const generateKeyNamesByAccessLevel = <AccessLevel extends PreDBAccessLevel>(namespace: string, accessLevels: AccessLevel[]) => {
	return accessLevels.reduce((keyMapper, currentAccessLevel) => {
		const currentKey = currentAccessLevel.name as AccessLevel['name'];
		keyMapper[currentKey] = generateDefaultKeyName(namespace, currentAccessLevel.name) as PermissionKey;

		return keyMapper;
	}, {} as { [key in AccessLevel['name']]: PermissionKey });
};

export const defaultPermissionKeySuffix = 'permission-key';
export const defaultLevelsRouteLookupWords: { [k: string]: string } = {
	'query': 'Read',
	'query-unique': 'Read',
	'sync': 'Read',
	'patch': 'Write',
	'upsert': 'Write',
	'upsert-all': 'Write',
	'delete': 'Delete',
	'delete-all': 'Delete',
	'delete-unique': 'Delete'
};
