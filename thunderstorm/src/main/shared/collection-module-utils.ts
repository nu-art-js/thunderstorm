import {Module} from '@nu-art/ts-common';

export const findCollectionModule = <M extends Module>(modules: M[], dbName: string) => {
	if (!dbName)
		return undefined;

	return modules.find(module => (module as any).dbDef?.dbName === dbName);

};
export const getCollectionModules = <M extends Module>(modules: M[], dbNames: string[]) => {
	if (!dbNames || dbNames.length === 0)
		return [];

	return modules.filter(module => dbNames.includes((module as any).dbDef?.dbName));
};