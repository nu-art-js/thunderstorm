import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@thunder-storm/core/frontend';
import * as React from 'react';
import {DBProto_PermissionAccessLevel} from '../shared';
import {ModuleFE_PermissionAccessLevel} from './ModuleFE_PermissionAccessLevel';
import {DBItemDropDownMultiSelector} from '@thunder-storm/core/frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@thunder-storm/styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_PermissionAccessLevel> = {
	module: ModuleFE_PermissionAccessLevel,
	modules: [ModuleFE_PermissionAccessLevel],
	mapper: item => [item.name],
	placeholder: 'Choose a PermissionAccessLevel',
	renderer: item => <>{item.name}</>
};

export const DropDown_PermissionAccessLevel = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionAccessLevel,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.name}</>;
	},
	uiSelector: DropDown_PermissionAccessLevel.selectable,
});

export const MultiSelect_PermissionAccessLevel = TS_MultiSelect_V2.prepare(Props_MultiSelect);

