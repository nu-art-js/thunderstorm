import {_keys, EmptyObject, exists, reduceToMap, TypedMap} from '@thunder-storm/common';
import {EditableItem} from '../utils/EditableItem';
import {openContent} from '../component-modules/mouse-interactivity';


type CustomErrorLevel = string

export type ComponentProps_Error = {
	error?: {
		message?: string,
		level: 'error' | 'warning' | CustomErrorLevel
	};
	showErrorTooltip?: boolean
}

type ResolveEditableErrorParams<T> = {
	editable: EditableItem<T>,
	prop: keyof T,

	error?: ComponentProps_Error['error']
	ignoreError?: boolean,
};

export const convertToHTMLDataAttributes = (attributes?: TypedMap<string>, prefix?: string) => {
	if (!attributes)
		return EmptyObject;

	const finalImpl = prefix ? `${prefix}-` : '';
	return reduceToMap(_keys(attributes), key => `data-${finalImpl}${key}`, key => attributes[key]);
};

export const getErrorTooltip = (errors?: TypedMap<string>, shouldReturn: boolean = false) => {
	if (!exists(errors) || !shouldReturn)
		return {};

	return openContent.tooltip.top('input-error-tooltip', () => errors.message, {offset: 6});
};

export const resolveEditableError = <T>(errorHandler: ResolveEditableErrorParams<T>) => {
	if (errorHandler.ignoreError)
		return;

	if (errorHandler.error)
		return errorHandler.error;

	const errorMessage = errorHandler.editable.hasError(errorHandler.prop);
	if (!errorHandler.error && errorMessage)
		return {level: 'error', message: String(errorMessage)};
};