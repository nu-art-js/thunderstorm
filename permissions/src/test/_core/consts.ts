import {DB_PermissionGroup} from '../../main';

export const Default_TestEmail = 'test@test.test';
export const Default_TestPassword = '1234';
export const TestProject__Name = 'test-project';

export const Group_ToCreate_Read: Partial<DB_PermissionGroup> = {
	label: 'test-read',
	accessLevelIds: ['Read']
};
export const Group_ToCreate_Delete: Partial<DB_PermissionGroup> = {
	label: 'test-read',
	accessLevelIds: ['Delete']
};
export const Group_ToCreate_NoAccess: Partial<DB_PermissionGroup> = {
	label: 'test-read',
	accessLevelIds: ['NoAccess']
};
export const Groups_ToCreate = [
	Group_ToCreate_Read,
	Group_ToCreate_Delete,
	Group_ToCreate_NoAccess
];