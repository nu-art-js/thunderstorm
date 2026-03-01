import * as React from 'react';
import {
	prepareGenericDropDown,
	TemplatingProps_TS_GenericDropDown,
	TS_MultiSelect_V2,
	DBItemDropDownMultiSelector,
} from '@nu-art/editable-item';
import {DatabaseDef_PermissionProject} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionProject} from './ModuleFE_PermissionProject.js';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionProject> = {
	module: ModuleFE_PermissionProject,
	modules: [ModuleFE_PermissionProject],
	mapper: item => [item.name],
	placeholder: 'Choose a PermissionProject',
	renderer: item => <>{item.name}</>
};


const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionProject,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.name}</>;
	},
	uiSelector: prepareGenericDropDown(Props_DropDown).selectable,
});

export const MultiSelect_PermissionProject = TS_MultiSelect_V2.prepare(Props_MultiSelect) as React.ComponentType<any>;

