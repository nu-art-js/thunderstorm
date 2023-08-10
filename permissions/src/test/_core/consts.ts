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


export const Test_Setup1 = {
	projects: [{
		name: TestProject__Name,
		apis: [
			{
				path: 'v1/stam',
				domain: Test_Domain1,
				levelNames: [Test_AccessLevel_Read, Test_AccessLevel_Delete]
			}
		],
		domains: [{
			namespace: Test_Domain1,
			levels: [
				{name: Test_AccessLevel_NoAccess, value: 0},
				{name: Test_AccessLevel_Read, value: 100},
				{name: Test_AccessLevel_Write, value: 200},
				{name: Test_AccessLevel_Delete, value: 300},
				{name: Test_AccessLevel_Admin, value: 1000},
			]
		}],
	}],
};
