import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {DBProto_PermissionAPI} from '../shared';
import {ModuleFE_PermissionAPI} from './ModuleFE_PermissionAPI';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm/frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_PermissionAPI> = {
	module: ModuleFE_PermissionAPI,
	modules: [ModuleFE_PermissionAPI],
	mapper: item => [item.path],
	placeholder: 'Choose a PermissionAPI',
	renderer: item => <div className="ll_h_c"> {item.path} </div>
};

export const DropDown_PermissionAPI = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionAPI,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.path}</>;
	},
	uiSelector: DropDown_PermissionAPI.selectable,
});

export const MultiSelect_PermissionAPI = TS_MultiSelect_V2.prepare(Props_MultiSelect);

