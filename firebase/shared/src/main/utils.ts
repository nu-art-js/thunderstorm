import {__stringify, DB_Object, exists, getDotNotatedValue, md5, MUSTNeverHappenException, PreDB} from '@nu-art/ts-common';

export const composeDbObjectUniqueId = <T extends PreDB<DB_Object>>(item: T, keys: string[]) => {
	const _unique = keys.reduce<string>((aggregatedValues, _key) => {
		const value = getDotNotatedValue(_key as any, item);
		if (!exists(value))
			throw new MUSTNeverHappenException(`Unique key missing from db item!\nkey: ${_key}\nitem:${__stringify(item, true)}`);

		return aggregatedValues + String(value);
	}, '');
	return md5(_unique);
};