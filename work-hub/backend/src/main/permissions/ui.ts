import {generateDomainDefaults} from '@nu-art/permissions-backend/core/utils';
import {PermissionKeys_WorkHubUI, PermissionsDomainName_WorkHubUI} from '@nu-art/work-hub-shared';
import {defaultUIAccessLevels} from '@nu-art/permissions-shared';
import {DefaultDef_Package} from '@nu-art/permissions-backend';

const PermissionsDomain_WorkHubUI = generateDomainDefaults(PermissionsDomainName_WorkHubUI, PermissionsDomainName_WorkHubUI, defaultUIAccessLevels, PermissionKeys_WorkHubUI);
export const PermissionsPackage_WorkHubUI: DefaultDef_Package = {
	name: 'Unresolved Codes - UI',
	domains: [PermissionsDomain_WorkHubUI.domain],
};