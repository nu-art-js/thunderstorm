/*
 * Editable GenericDropDown factories.
 * Imports GenericDropDown from local TS_DropDown. Do not add any
 * @nu-art/thunderstorm-* dependency to make it compile.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {DBPointer} from '@nu-art/ts-common';
import {type ResolvableContent, resolveContent} from '@nu-art/ts-common';
import type {UIProps_EditableItem} from '../core/EditableItem.js';
import type {EditableBaseProps} from './resolve-editable-error.js';
import {resolveEditableError, withEditableErrorProps} from './resolve-editable-error.js';
import {
	GenericDropDown_DBPointer_Item,
	GenericDropDown,
	TemplatingProps_TS_GenericDropDown,
	TemplatingProps_TS_GenericDropDown_DBPointer
} from '../components/TS_DropDown/GenericDropDown.js';
import {DB_Prototype} from '@nu-art/db-api-shared';

export type EditableItemProps_GenericDropDown<T> =
	EditableBaseProps
	& UIProps_EditableItem<any, any, string>
	& {
	onSelected?: (selected: T | undefined, superOnSelected: (selected?: T) => Promise<void>) => void;
	canUnselect?: boolean;
};

export type EditableItemProps_GenericDropDown_DBPointer<T> =
	EditableBaseProps
	& UIProps_EditableItem<any, any, DBPointer>
	& {
	onSelected?: (selected: T | undefined, superOnSelected: (selected?: T) => Promise<void>) => void;
	canUnselect?: boolean;
};

export function createEditableGenericDropDown<Database extends DB_Prototype<any>>(
	mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown<Database>>
) {
	return (props: EditableItemProps_GenericDropDown<Database['dbType']>) => {
		const _mandatoryProps = resolveContent(mandatoryProps);
		const {editable, prop, ...restProps} = props;

		const onSelected = async (item: Database['dbType']) => {
			await editable.updateObj({[prop]: item?._id} as Partial<Database['dbType']>);
		};

		return <GenericDropDown<Database>
			error={resolveEditableError(withEditableErrorProps(props))}
			{..._mandatoryProps}
			{...restProps}
			onSelected={async item => {
				if (props.onSelected)
					return props.onSelected(item, onSelected);
				return onSelected(item);
			}}
			selected={editable.item[prop] as Database['dbType']}/>;
	};
}

export function createEditableGenericDropDownPointer<Database extends DB_Prototype<any>>(
	mandatoryProps: ResolvableContent<TemplatingProps_TS_GenericDropDown_DBPointer<Database>>
) {
	return (props: EditableItemProps_GenericDropDown_DBPointer<GenericDropDown_DBPointer_Item<Database>>) => {
		const _mandatoryProps = resolveContent(mandatoryProps);
		const {editable, prop, ...restProps} = props;

		const onSelected = async (wrapper: GenericDropDown_DBPointer_Item<Database>) => {
			await editable.updateObj({[prop]: wrapper.item._id});
		};

		return <GenericDropDown
			error={resolveEditableError(withEditableErrorProps(props))}
			{..._mandatoryProps}
			{...restProps}
			onSelected={async item => {
				if (props.onSelected)
					return props.onSelected(item, () => onSelected(item));
				return onSelected(item);
			}}
			selected={editable.item[prop] as string | undefined}
			// @ts-ignore
			module={undefined}
		/>;
	};
}
