/*
 * @nu-art/editable-item-e2e-tests - UI components for editable-test (dropdown, multiselect)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ModuleFE_EditableTest} from './ModuleFE_EditableTest.js';
import {DBItemDropDownMultiSelector} from '@nu-art/editable-item';
import type {DBProto_EditableTest} from '../../shared/types.js';
import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown} from '@nu-art/thunder-widgets';
import {TS_MultiSelect_V2} from '@nu-art/editable-item';

const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_EditableTest> = {
	module: ModuleFE_EditableTest,
	modules: [ModuleFE_EditableTest],
	mapper: (item) => [item.a],
	placeholder: 'Choose a EditableTest',
	renderer: (item) => <div className="ll_h_c"> {item.a} </div>,
};
export const DropDown_EditableTest = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_EditableTest,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <>{item.a}</>;
	},
	uiSelector: DropDown_EditableTest.selectable,
});
export const MultiSelect_EditableTest = TS_MultiSelect_V2.prepare(Props_MultiSelect);
