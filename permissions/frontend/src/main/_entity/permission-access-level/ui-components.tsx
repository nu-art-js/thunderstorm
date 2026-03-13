import {DBItemDropDownMultiSelector, prepareGenericDropDown, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2,} from '@nu-art/editable-item';
import {DatabaseDef_PermissionAccessLevel} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionAccessLevel} from './ModuleFE_PermissionAccessLevel.js';
import {TS_Icons} from '@nu-art/ts-styles';

const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionAccessLevel> = {
	module: ModuleFE_PermissionAccessLevel,
	modules: [ModuleFE_PermissionAccessLevel],
	mapper: item => [item.name],
	placeholder: 'Choose a PermissionAccessLevel',
	renderer: item => <>{item.name}</>
};

export const DropDown_PermissionAccessLevel = prepareGenericDropDown(Props_DropDown);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionAccessLevel,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.name}</>;
	},
	uiSelector: DropDown_PermissionAccessLevel.selectable,
});

export const MultiSelect_PermissionAccessLevel = TS_MultiSelect_V2.prepare(Props_MultiSelect);
