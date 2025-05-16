import {_keys, deepClone, StringMap} from '@nu-art/ts-common';
import {TS_PackageJSON} from '../v3/UnitsMapper/types';


export function convertPackageJSONTemplateToPackJSON_Value(template: Readonly<TS_PackageJSON>, value: (value: string) => string): TS_PackageJSON {
	const packageJson = deepClone(template);
	packageJson.dependencies = (_keys(packageJson.dependencies ?? {}) as string[])?.reduce((dependencies, dependencyKey: string) => {
		dependencies[dependencyKey] = value(dependencyKey) ?? packageJson.dependencies![dependencyKey];
		return dependencies;
	}, {} as StringMap);

	return Object.freeze(packageJson);
}
