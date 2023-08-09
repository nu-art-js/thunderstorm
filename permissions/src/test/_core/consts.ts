import {DB_PermissionGroup} from '../../main';


export const Default_TestEmail = 'test@test.test';
export const Default_TestPassword = '1234';
export const TestProject__Name = 'test-project';
export const Test_Api_Stam = 'v1/stam';
export const Group_ToCreate_Read: Partial<DB_PermissionGroup> = {
	label: 'test-group-read',
	accessLevelIds: ['Read']
};
export const Group_ToCreate_Delete: Partial<DB_PermissionGroup> = {
	label: 'test-group-delete',
	accessLevelIds: ['Delete']
};
export const Group_ToCreate_NoAccess: Partial<DB_PermissionGroup> = {
	label: 'test-group-no_access',
	accessLevelIds: ['NoAccess']
};
export const Groups_ToCreate = [
	Group_ToCreate_Read,
	Group_ToCreate_Delete,
	Group_ToCreate_NoAccess
];

export const Test_AccessLevel_NoAccess = 'NoAccess';
export const Test_AccessLevel_Read = 'Read';
export const Test_AccessLevel_Write = 'Write';
export const Test_AccessLevel_Delete = 'Delete';
export const Test_AccessLevel_Admin = 'Admin';

export const Test_Domain1 = 'test-domain-1';

export const Failed_Log = ' ___/-\\___\n' +
	'|---------|\n' +
	' | | F | |\n' +
	' | P a h |\n' +
	' | | i | |\n' +
	' | | l | |\n' +
	' |_______|';