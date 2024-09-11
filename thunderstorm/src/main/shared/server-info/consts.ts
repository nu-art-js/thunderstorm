import {BadImplementationException} from '@nu-art/ts-common';

export const Default_ServerInfoNodePath = '/state/ModuleBE_ServerInfo/serverInfo';

/**
 * Translates the version '1.2.3' into 100020003 numeric value for indexing purposes.
 */
export const versionStringToNumeric = (version: string): number => {
	return version.split('.').reduce((result, current) => {
		const value = parseInt(current);
		if (Number.isNaN(value))
			throw new BadImplementationException(`Received version ${version} can't be converted into a number. 'parseInt(${current})' returns NaN!!!`);

		if (result > 0)
			result *= 10000;

		result += value;
		return result;
	}, 0);
};