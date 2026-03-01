import {
	GenericDropDown,
	TemplatingProps_TS_GenericDropDown,
	TS_MultiSelect_V2,
	DBItemDropDownMultiSelector,
} from '@nu-art/editable-item';
import {DatabaseDef_PermissionAPI} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionAPI} from './ModuleFE_PermissionAPI.js';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionAPI> = {
	module: ModuleFE_PermissionAPI,
	modules: [ModuleFE_PermissionAPI],
	mapper: item => [item.path],
	placeholder: 'Choose a PermissionAPI',
	renderer: item => <div className="ll_h_c"> {item.path} </div>
};

// Editable pattern: use .editable with editable+prop, .selectable for multi-select (same as EDITABLE.GenericDropDownV3).
export const DropDown_PermissionAPI = GenericDropDown.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionAPI,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.path}</>;
	},
	uiSelector: DropDown_PermissionAPI.selectable,
});

export const MultiSelect_PermissionAPI = TS_MultiSelect_V2.prepare(Props_MultiSelect);

