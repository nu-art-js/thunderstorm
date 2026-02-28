import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm-frontend/index';
import {DatabaseDef_PermissionProject} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionProject} from './ModuleFE_PermissionProject.js';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm-frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionProject> = {
	module: ModuleFE_PermissionProject,
	modules: [ModuleFE_PermissionProject],
	mapper: item => [item.name],
	placeholder: 'Choose a PermissionProject',
	renderer: item => <>{item.name}</>
};

// Editable pattern: use .editable with editable+prop, .selectable for multi-select (same as EDITABLE.GenericDropDownV3).
// Cast: thunderstorm GenericDropDownV3 expects DBProto; we use db-api DatabaseDef_*.
export const DropDown_PermissionProject = GenericDropDownV3.prepare(Props_DropDown as never);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionProject,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.name}</>;
	},
	uiSelector: DropDown_PermissionProject.selectable,
});

export const MultiSelect_PermissionProject = TS_MultiSelect_V2.prepare(Props_MultiSelect);

