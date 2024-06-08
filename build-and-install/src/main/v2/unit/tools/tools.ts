import {__stringify} from '@nu-art/ts-common';
import {PackageJson} from '../../../core/types';


export function convertPackageJSONTemplateToPackJSON_Value(template: PackageJson, value: (value: string, key?: string) => string): PackageJson {
	let workspacePackageJsonAsString = __stringify(template, true);
	let match = null;
	do {
		match = workspacePackageJsonAsString.match(/"(.*?)": ?"\$([A-Z_]+?)"/);
		if (match?.[0])
			workspacePackageJsonAsString = workspacePackageJsonAsString.replace(new RegExp(`\\$${match[2]}`), value(match[2], match[1]));
	} while (match);

	const packageJson = JSON.parse(workspacePackageJsonAsString) as PackageJson;

	return packageJson;
}
