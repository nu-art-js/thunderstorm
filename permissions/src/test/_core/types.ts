import {UI_Account} from '@nu-art/user-account';
import {PreDB} from '@nu-art/ts-common';

export type Test_Api = { path: string, accessLevels: { domainName: string, levelName: string }[] };
export type Test_Project = {
	name: string,
	apis: Test_Api[],
	domains: {
		namespace: string,
		levels: { name: string, value: number }[]
	}[]
}
export type Test_Setup = {
	projects: Test_Project[];
};
export type Test_TargetAccount = PreDB<UI_Account> & {
	domains: {
		namespace: string,
		accessLevel: string
	}[],
	result: boolean
};