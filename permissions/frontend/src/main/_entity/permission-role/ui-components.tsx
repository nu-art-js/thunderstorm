import {
	prepareGenericDropDown,
	TemplatingProps_TS_GenericDropDown,
	TS_MultiSelect_V2,
	DBItemDropDownMultiSelector,
} from '@nu-art/editable-item';
import {DatabaseDef_PermissionRole} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionRole} from './ModuleFE_PermissionRole.js';
import {TS_Icons} from '@nu-art/ts-styles';

const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionRole> = {
	module: ModuleFE_PermissionRole,
	modules: [ModuleFE_PermissionRole],
	mapper: item => [item.label],
	placeholder: 'Choose a Role',
	renderer: item => <>{item.label}</>
};

export const DropDown_PermissionRole = prepareGenericDropDown(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionRole,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.label}</>;
	},
	uiSelector: DropDown_PermissionRole.selectable,
});

export const MultiSelect_PermissionRole = TS_MultiSelect_V2.prepare(Props_MultiSelect);
