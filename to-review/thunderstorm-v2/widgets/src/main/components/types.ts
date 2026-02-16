import {_keys, EmptyObject, exists, reduceToMap, TypedMap} from '@nu-art/ts-common';

type CustomErrorLevel = string

export type ComponentProps_Error = {
	error?: {
		message?: string,
		level: 'error' | 'warning' | CustomErrorLevel
	};
	showErrorTooltip?: boolean
}

export type ResolveEditableErrorParams<T> = {
	hasError: (prop: keyof T) => boolean,
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

export type ErrorTooltipAPI = (id: string, content: () => string, config?: { offset?: number }) => Record<string, unknown>;

let errorTooltipAPI: ErrorTooltipAPI | null = null;

export const setErrorTooltipAPI = (api: ErrorTooltipAPI | null) => {
	errorTooltipAPI = api;
};

export const getErrorTooltip = (errors?: TypedMap<string>, shouldReturn: boolean = false) => {
	if (!exists(errors) || !shouldReturn || !errorTooltipAPI)
		return {};

	return errorTooltipAPI('input-error-tooltip', () => errors.message, {offset: 6});
};

export const resolveEditableError = <T>(errorHandler: ResolveEditableErrorParams<T>) => {
	if (errorHandler.ignoreError)
		return;

	if (errorHandler.error)
		return errorHandler.error;

	const errorMessage = errorHandler.hasError(errorHandler.prop);
	if (!errorHandler.error && errorMessage)
		return {level: 'error', message: String(errorMessage)};
};