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

export const Test_AccessLevel_NoAccess = 'NoAccess';
export const Test_AccessLevel_Read = 'Read';
export const Test_AccessLevel_Write = 'Write';
export const Test_AccessLevel_Delete = 'Delete';
export const Test_AccessLevel_Admin = 'Admin';

export const Test_Domain1 = 'test-domain-1';
