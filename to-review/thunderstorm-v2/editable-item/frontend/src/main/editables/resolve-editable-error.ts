/*
 * resolveEditableError — mirrors thunder-widgets components/types (not exported from widgets main).
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {EditableItem} from '../core/EditableItem.js';

export type ComponentProps_Error = {
	error?: { message?: string; level: string };
	showErrorTooltip?: boolean;
};

export type EditableBaseProps = ComponentProps_Error & Record<string, unknown>;

export type ResolveEditableErrorParams<T> = {
	hasError: (prop: keyof T) => boolean;
	prop: keyof T;
	error?: ComponentProps_Error['error'];
	ignoreError?: boolean;
};

export function resolveEditableError<T>(errorHandler: ResolveEditableErrorParams<T>): ComponentProps_Error['error'] | undefined {
	if (errorHandler.ignoreError)
		return undefined;

	if (errorHandler.error)
		return errorHandler.error;

	const errorMessage = errorHandler.hasError(errorHandler.prop);
	if (!errorHandler.error && errorMessage)
		return {level: 'error', message: String(errorMessage)};

	return undefined;
}

type ItemTypeOf<P> = P extends { editable: EditableItem<infer T> } ? T : never;

export function withEditableErrorProps<P extends { editable: EditableItem<any>; prop: PropertyKey }>(
	props: P
): P & ResolveEditableErrorParams<ItemTypeOf<P>> {
	return {
		...props,
		hasError: (_k: keyof ItemTypeOf<P>) => !!props.editable.hasError(props.prop),
	};
}
