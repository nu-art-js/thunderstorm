import {
	prepareGenericDropDown,
	TemplatingProps_TS_GenericDropDown,
	TS_MultiSelect_V2,
	DBItemDropDownMultiSelector,
} from '@nu-art/editable-item';
import {DatabaseDef_PermissionGroup} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionGroup} from './ModuleFE_PermissionGroup.js';
import {TS_Icons} from '@nu-art/ts-styles';

const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionGroup> = {
	module: ModuleFE_PermissionGroup,
	modules: [ModuleFE_PermissionGroup],
	mapper: item => [item.label],
	placeholder: 'Choose a PermissionGroup',
	renderer: item => <>{item.label}</>
};

export const DropDown_PermissionGroup = prepareGenericDropDown(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionGroup,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.label}</>;
	},
	uiSelector: DropDown_PermissionGroup.selectable,
});

export const MultiSelect_PermissionGroup = TS_MultiSelect_V2.prepare(Props_MultiSelect);

