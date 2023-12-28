import {_keys, EmptyObject, reduceToMap, TypedMap} from '@nu-art/ts-common';


type CustomErrorLevel = string

export type ComponentProps_Error = {
	error?: {
		message?: string,
		level: 'error' | 'warning' | CustomErrorLevel
	}
}

export const convertToHTMLDataAttributes = (attributes?: TypedMap<string>, prefix?: string) => {
	if (!attributes)
		return EmptyObject;

	const finalImpl = prefix ? `${prefix}-` : '';
	return reduceToMap(_keys(attributes), key => `data-${finalImpl}${key}`, key => attributes[key]);
};