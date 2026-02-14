import {_keys, EmptyObject, exists, reduceToMap, TypedMap} from '@nu-art/ts-common';
import {openContent} from '../component-modules/mouse-interactivity/index.js';

type CustomErrorLevel = string

export type ComponentProps_Error = {
	error?: {
		message?: string,
		level: 'error' | 'warning' | CustomErrorLevel
	};
	showErrorTooltip?: boolean
}

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