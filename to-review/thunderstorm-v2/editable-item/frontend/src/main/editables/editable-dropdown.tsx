/*
 * Editable DropDown factory.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {MandatoryProps_TS_DropDown, TS_DropDown} from '@nu-art/thunder-widgets';
import {resolveEditableError, withEditableErrorProps} from './resolve-editable-error.js';
import {resolveContent, type ResolvableContent} from '@nu-art/ts-common';
import type {UIProps_EditableItem} from '../core/EditableItem.js';
import type {BasePartialProps_DropDown} from '@nu-art/thunder-widgets';
import type {ComponentProps_Error} from './resolve-editable-error.js';

export type Props_CanUnselect_NonMandatory<ItemType> = { canUnselect: true; onSelected?: (selected?: ItemType) => void };
export type Props_CanNotUnselect_NonMandatory<ItemType> = { canUnselect?: false; onSelected?: (selected: ItemType) => void };

export type EditableItemProps_TS_DropDown<ItemType, EditableType extends {} = any, ValueType extends EditableType[keyof EditableType] = EditableType[keyof EditableType]> =
	BasePartialProps_DropDown<ItemType>
	& UIProps_EditableItem<EditableType, keyof EditableType, ValueType>
	& ComponentProps_Error
	& (Props_CanUnselect_NonMandatory<ItemType> | Props_CanNotUnselect_NonMandatory<ItemType>);

/** @deprecated Use EditableItemProps_TS_DropDown. */
export type EditableDropDownProps<ItemType, EditableType extends {} = any, ValueType extends EditableType[keyof EditableType] = EditableType[keyof EditableType]> =
	EditableItemProps_TS_DropDown<ItemType, EditableType, ValueType>;

export function createEditableDropDown<T, EditableType extends {} = any, ValueType extends EditableType[keyof EditableType] = EditableType[keyof EditableType]>(
	mandatoryProps: ResolvableContent<MandatoryProps_TS_DropDown<T>>
) {
	return (props: EditableItemProps_TS_DropDown<T, EditableType, ValueType>) => {
		return <TS_DropDown<T>
			{...resolveContent(mandatoryProps)} {...props}
			error={resolveEditableError(withEditableErrorProps(props))}
			onSelected={(item?: T) => props.onSelected ? props.onSelected(item!) : props.editable.updateObj({[props.prop]: item} as EditableType)}
			selected={props.editable.item[props.prop] as T | undefined}/>;
	};
}
