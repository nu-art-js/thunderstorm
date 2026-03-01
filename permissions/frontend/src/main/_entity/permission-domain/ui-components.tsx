import {
	GenericDropDown,
	TemplatingProps_TS_GenericDropDown,
	TS_MultiSelect_V2,
	DBItemDropDownMultiSelector,
} from '@nu-art/editable-item';
import {DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionDomain} from './ModuleFE_PermissionDomain.js';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionDomain> = {
	module: ModuleFE_PermissionDomain,
	modules: [ModuleFE_PermissionDomain],
	mapper: item => [item.namespace],
	placeholder: 'Choose a PermissionDomain',
	renderer: item => <>{item.namespace}</>
};

// Editable pattern: use .editable with editable+prop, .selectable for multi-select (same as EDITABLE.GenericDropDownV3).
export const DropDown_PermissionDomain = GenericDropDown.prepare(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionDomain,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.namespace}</>;
	},
	uiSelector: DropDown_PermissionDomain.selectable,
});

export const MultiSelect_PermissionDomain = TS_MultiSelect_V2.prepare(Props_MultiSelect);

