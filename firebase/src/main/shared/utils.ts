import {__stringify, DB_Object, exists, md5, MUSTNeverHappenException, PreDB} from "@nu-art/ts-common";

export const composeItemId = <T extends PreDB<DB_Object>, K extends (keyof T)[]>(item: T, keys: K) => {
	const _unique = keys.reduce<string>((aggregatedValues, _key) => {
		if (!exists(item[_key]))
			throw new MUSTNeverHappenException(`Unique key missing from db item!\nkey: ${_key as string}\nitem:${__stringify(item, true)}`);

		return aggregatedValues + String(item[_key]);
	}, '');
	return md5(_unique);
}