/*
 * Editable Input factories.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TS_Input, type BaseAppLevelProps_TS_InputV2, type TemplatingProps_TS_InputV2} from '@nu-art/thunder-widgets';
import {resolveEditableError, withEditableErrorProps} from './resolve-editable-error.js';
import type {TS_Object} from '@nu-art/ts-common';
import {createSaveEventHandlers, mergeSaveEvents} from './save-event-handler.js';
import type {UIProps_EditableItem} from '../core/EditableItem.js';

export type EditableItemProps_TS_InputV2<ValueType, K extends keyof T, T extends TS_Object & { [k in K]: ValueType } | ValueType[]> =
	Omit<BaseAppLevelProps_TS_InputV2, 'value'> & { value?: ValueType }
	& UIProps_EditableItem<T, K, ValueType>
	& { onChange?: (value: ValueType) => Promise<any> | any };

function editableTimeOptional(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & { [k in K]?: number | string }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		return _editableTime(templateProps)(props);
	};
}

function editableTime(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & { [k in K]: number | string }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		return _editableTime(templateProps)(props);
	};
}

function _editableTime(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & { [k in K]: number | string }>(props: EditableItemProps_TS_InputV2<number | string, K, T>) => {
		const {type, ...restTemplatingProps} = templateProps;
		const {editable, prop, showErrorTooltip, saveEvent, onChange: _onChange, ...rest} = props;
		const _saveEvents = mergeSaveEvents(templateProps, props);
		const saveEventHandler = (value: string | number) => {
			return _onChange ? _onChange(value) : editable.updateObj({[prop]: value} as T);
		};
		const handlers = createSaveEventHandlers<string | number>(_saveEvents, saveEventHandler);

		const value: string = props.editable.get(props.prop);

		return <TS_Input
			error={resolveEditableError(withEditableErrorProps({...rest, editable: props.editable, prop}))}
			{...restTemplatingProps} {...rest}
			type={type}
			onChange={handlers.onChange}
			showErrorTooltip={showErrorTooltip}
			onBlur={handlers.onBlur}
			onAccept={handlers.onAccept}
			value={String(props.value ?? value)}/>;
	};
}

function editableNumberOptional(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & { [k in K]?: number }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		// @ts-ignore
		return _editableNumber(templateProps)(props);
	};
}

function editableNumber(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & { [k in K]: number }>(props: EditableItemProps_TS_InputV2<any, K, T>) => {
		return _editableNumber(templateProps)(props);
	};
}

function _editableNumber(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & { [k in K]: number }>(props: EditableItemProps_TS_InputV2<number, K, T>) => {
		const {type, ...restTemplatingProps} = templateProps;
		const {editable, prop, showErrorTooltip, saveEvent, onChange: _onChange, ...rest} = props;
		const _saveEvents = mergeSaveEvents(templateProps, props);
		const saveEventHandler = (value: string) => {
			return _onChange ? _onChange(+value) : editable.updateObj({[prop]: +value} as T);
		};
		const handlers = createSaveEventHandlers<string>(_saveEvents, saveEventHandler);

		const value: string = props.editable.get(props.prop);

		return <TS_Input
			error={resolveEditableError(withEditableErrorProps({...rest, editable: props.editable, prop}))}
			{...restTemplatingProps} {...rest}
			type={type}
			showErrorTooltip={showErrorTooltip}
			onChange={handlers.onChange}
			onBlur={handlers.onBlur}
			onAccept={handlers.onAccept}
			value={String(props.value ?? value)}/>;
	};
}

function editableOptional(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & ({ [k in K]?: string })>(props: EditableItemProps_TS_InputV2<string | undefined, K, T>) => {
		return _editable(templateProps)(props);
	};
}

function editableArray(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends keyof T, T extends string[]>(props: EditableItemProps_TS_InputV2<string, K, T>) => {
		// @ts-ignore
		return _editable(templateProps)(props);
	};
}

function editable(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & ({ [k in K]: string })>(props: EditableItemProps_TS_InputV2<string, K, T>) => {
		// @ts-ignore
		return _editable(templateProps)(props);
	};
}

function _editable(templateProps: TemplatingProps_TS_InputV2) {
	return <K extends string, T extends TS_Object & ({ [k in K]?: string } | { [k in K]: string })>(props: EditableItemProps_TS_InputV2<string | undefined, K, T>) => {
		const {type, ...restTemplatingProps} = templateProps;
		const {editable, prop, showErrorTooltip, saveEvent, onChange: _onChange, ...rest} = props;
		const _saveEvents = mergeSaveEvents(templateProps, props);
		const saveEventHandler = (value: string) => {
			return _onChange ? _onChange(value) : editable.updateObj({[prop]: value} as T);
		};
		const handlers = createSaveEventHandlers<string>(_saveEvents, saveEventHandler);

		const value: string = editable.get(prop);
		return <TS_Input
			error={resolveEditableError(withEditableErrorProps({...rest, editable, prop}))}
			{...restTemplatingProps} {...rest}
			type={type}
			onChange={handlers.onChange}
			onBlur={handlers.onBlur}
			onAccept={handlers.onAccept}
			showErrorTooltip={showErrorTooltip}
			value={props.value ?? value}/>;
	};
}

export const EditableInput = {
	editableTimeOptional,
	editableTime,
	_editableTime,
	editableNumberOptional,
	editableNumber,
	_editableNumber,
	editableOptional,
	editableArray,
	editable,
};
