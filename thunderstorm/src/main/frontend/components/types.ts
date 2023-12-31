import {_keys, EmptyObject, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {EditableItem} from '../utils/EditableItem';


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

export const resolveEditableError = <T extends any>(editable: EditableItem<T>, prop: keyof T, error?: ComponentProps_Error["error"]) => {
	const errorMessage = editable.hasError(prop);
	if (error)
		return error;

	if (!error && errorMessage)
		return {level: 'error', message: String(errorMessage)};
};