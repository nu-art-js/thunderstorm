import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm/frontend';
import * as React from 'react';
import {DBProto_PermissionProject} from '../shared';
import {ModuleFE_PermissionProject} from './ModuleFE_PermissionProject';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm/frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DBProto_PermissionProject> = {
	module: ModuleFE_PermissionProject,
	modules: [ModuleFE_PermissionProject],
	mapper: item => [item.name],
	placeholder: 'Choose a PermissionProject',
	renderer: item => <>{item.name}</>
};

export const DropDown_PermissionProject = GenericDropDownV3.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionProject,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.name}</>;
	},
	uiSelector: DropDown_PermissionProject.selectable,
});

export const MultiSelect_PermissionProject = TS_MultiSelect_V2.prepare(Props_MultiSelect);

