import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm-frontend/index';
import {DatabaseDef_PermissionAPI} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionAPI} from './ModuleFE_PermissionAPI.js';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm-frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionAPI> = {
	module: ModuleFE_PermissionAPI,
	modules: [ModuleFE_PermissionAPI],
	mapper: item => [item.path],
	placeholder: 'Choose a PermissionAPI',
	renderer: item => <div className="ll_h_c"> {item.path} </div>
};

// Cast: thunderstorm GenericDropDownV3 expects DBProto/module shape; we use db-api-frontend ModuleFE_BaseApi<DatabaseDef_*>.
export const DropDown_PermissionAPI = GenericDropDownV3.prepare(Props_DropDown as never);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionAPI as never,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.path}</>;
	},
	uiSelector: DropDown_PermissionAPI.selectable,
});

export const MultiSelect_PermissionAPI = TS_MultiSelect_V2.prepare(Props_MultiSelect);

