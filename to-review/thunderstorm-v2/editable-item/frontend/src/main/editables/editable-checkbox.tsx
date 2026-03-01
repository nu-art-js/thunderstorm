/*
 * Editable CheckBox factory.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type React from 'react';
import {TS_Checkbox, type Props_TS_CheckboxV2} from '@nu-art/thunder-widgets';
import type {SubsetKeys, TS_Object} from '@nu-art/ts-common';
import type {UIProps_EditableItem} from '../core/EditableItem.js';

type Props_Checkbox = { checked?: boolean; onCheck?: (v: boolean, e: React.MouseEvent<HTMLDivElement>) => void } & Record<string, unknown>;

export type EditableItemProps_TS_Checkbox<T extends TS_Object & { [k in K]?: any }, K extends SubsetKeys<keyof T, T, boolean | undefined>> =
	Omit<Props_Checkbox, 'checked'>
	& UIProps_EditableItem<T, K, boolean | undefined>
	& {
		checked?: boolean;
		onCheck?: (value: boolean, e: React.MouseEvent<HTMLDivElement>) => void;
	};

export type TemplatingProps_TS_Checkbox = Omit<Props_TS_CheckboxV2, 'checked' | 'onCheck'>;

export function createEditableCheckBox(templateProps: TemplatingProps_TS_Checkbox) {
	return <T extends TS_Object & { [k in K]?: any }, K extends SubsetKeys<keyof T, T, boolean | undefined>>(
		props: EditableItemProps_TS_Checkbox<T, K>
	) => {
		const checked = props.editable.get(props.prop);
		return <TS_Checkbox {...templateProps} {...props} checked={checked} onCheck={checked => props.editable.updateObj({[props.prop]: checked} as T)}/>;
	};
}
