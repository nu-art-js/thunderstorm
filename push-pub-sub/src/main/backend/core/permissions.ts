import {DefaultDef_Domain, DefaultDef_Group, DefaultDef_Package} from '@thunder-storm/permissions/shared/types';
import {CreateDefaultAccessLevels, DefaultAccessLevel_Admin} from '@thunder-storm/permissions/shared/consts';
import {ApiDef_PushMessages} from '../../shared';
import {Domain_Developer} from '@thunder-storm/permissions/backend/permissions';
import {ModuleBE_PushSubscriptionAPI} from '../modules/ModuleBE_PushSubscriptionDB';
import {_values} from '@thunder-storm/common';


const Domain_PushMessages_ID = 'ce2e840bb639c34887ae19c2c7c82c11';
const DefaultAccessLevel_Passive = Object.freeze({name: 'Passive', value: 0});
const DefaultAccessLevel_Active = Object.freeze({name: 'Active', value: 0});
const DefaultAccessLevel_Tester = Object.freeze({name: 'Tester', value: 600});

const accessLevels = [{...DefaultAccessLevel_Passive}, {...DefaultAccessLevel_Active}, {...DefaultAccessLevel_Tester}];
const _PermissionsDomain_PushMessages: DefaultDef_Domain = {
	_id: Domain_PushMessages_ID,
	namespace: 'Push Messages',
	dbNames: [],
	levels: CreateDefaultAccessLevels(Domain_PushMessages_ID, accessLevels),
	customApis: [
		..._values(ModuleBE_PushSubscriptionAPI.apiDef.v1).map(api => {
			return {
				path: api.path,
				accessLevel: DefaultAccessLevel_Admin.name,
				domainId: Domain_Developer._id

			};
		}),
		{path: ApiDef_PushMessages.v1.test.path, accessLevel: DefaultAccessLevel_Admin.name, domainId: Domain_Developer._id},
		{path: ApiDef_PushMessages.v1.register.path, accessLevel: DefaultAccessLevel_Active.name},
		{path: ApiDef_PushMessages.v1.registerAll.path, accessLevel: DefaultAccessLevel_Active.name},
		{path: ApiDef_PushMessages.v1.unregister.path, accessLevel: DefaultAccessLevel_Active.name},
	]
};

export const PermissionsDomain_PushMessages = Object.freeze(_PermissionsDomain_PushMessages);

const PermissionsGroupId_ProactivePushMessanger = '7f2c8925a6fdd2bcb9be3c1c0932deef';

const _PermissionsGroup_ProactivePushMessanger: DefaultDef_Group = {
	_id: PermissionsGroupId_ProactivePushMessanger,
	name: 'Push Messanger',
	uiLabel: 'Push Messenger',
	accessLevels: {
		[PermissionsDomain_PushMessages.namespace]: DefaultAccessLevel_Tester.name,
	}
};

export const PermissionsGroup_PushMessanger = Object.freeze(_PermissionsGroup_ProactivePushMessanger);

export const PermissionsPackage_PushMessages: DefaultDef_Package = {
	name: PermissionsDomain_PushMessages.namespace,
	domains: [PermissionsDomain_PushMessages],
	groups: [PermissionsGroup_PushMessanger]
};

