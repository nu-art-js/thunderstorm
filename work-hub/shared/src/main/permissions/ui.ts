import {defaultUIAccessLevels, generateKeyNamesByAccessLevel} from '@nu-art/permissions-shared';

export const PermissionsDomainName_WorkHubUI = 'Work Hub UI';
export const PermissionKeys_WorkHubUI = generateKeyNamesByAccessLevel(PermissionsDomainName_WorkHubUI, defaultUIAccessLevels);