import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {DBProto_PermissionGroup} from '../shared';
import {ModuleFE_PermissionGroup} from './ModuleFE_PermissionGroup';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm/frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@nu-art/ts-styles';

const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_PermissionGroup> = {
	module: ModuleFE_PermissionGroup,
	modules: [ModuleFE_PermissionGroup],
	mapper: item => [item.label],
	placeholder: 'Choose a PermissionGroup',
	renderer: item => <div className="ll_h_c"> {item.label} </div>
};

export const DropDown_PermissionGroup = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionGroup,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.label}</>;
	},
	uiSelector: DropDown_PermissionGroup.selectable,
});

export const MultiSelect_PermissionGroup = TS_MultiSelect_V2.prepare(Props_MultiSelect);

