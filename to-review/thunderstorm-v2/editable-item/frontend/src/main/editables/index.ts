/*
 * Editables — EDITABLE factories and type re-exports.
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {createEditableCheckBox} from './editable-checkbox.js';
import {createEditableDropDown} from './editable-dropdown.js';
import {createEditableGenericDropDown, createEditableGenericDropDownPointer} from './editable-generic-dropdown.js';
import {EditableInput} from './editable-input.js';
import {createEditableTextArea} from './editable-textarea.js';

export type {EditableItemProps_TS_DropDown, EditableDropDownProps} from './editable-dropdown.js';
export type {EditableItemProps_GenericDropDown, EditableItemProps_GenericDropDown_DBPointer} from './editable-generic-dropdown.js';
export type {EditableItemProps_TS_Checkbox} from './editable-checkbox.js';
export type {EditableItemProps_TS_InputV2} from './editable-input.js';
export type {EditableItemProps_TS_TextAreaV2} from './editable-textarea.js';

export const EDITABLE = {
	DropDown: createEditableDropDown,
	GenericDropDown: createEditableGenericDropDown,
	GenericDropDown_Pointer: createEditableGenericDropDownPointer,
	CheckBox: createEditableCheckBox,
	Input: EditableInput,
	TextArea: createEditableTextArea,
};
