import {GenericDropDownV3, TemplatingProps_TS_GenericDropDown, TS_MultiSelect_V2} from '@nu-art/thunderstorm-frontend/index';
import {DatabaseDef_PermissionDomain} from '@nu-art/permissions-shared';
import {ModuleFE_PermissionDomain} from './ModuleFE_PermissionDomain.js';
import {DBItemDropDownMultiSelector} from '@nu-art/thunderstorm-frontend/components/_TS_MultiSelect/DBItemDropDownMultiSelector';
import {TS_Icons} from '@nu-art/ts-styles';


const Props_DropDown: TemplatingProps_TS_GenericDropDown<DatabaseDef_PermissionDomain> = {
	module: ModuleFE_PermissionDomain,
	modules: [ModuleFE_PermissionDomain],
	mapper: item => [item.namespace],
	placeholder: 'Choose a PermissionDomain',
	renderer: item => <>{item.namespace}</>
};

// Cast: thunderstorm GenericDropDownV3 expects DBProto/module shape; we use db-api-frontend ModuleFE_BaseApi<DatabaseDef_*>.
export const DropDown_PermissionDomain = GenericDropDownV3.prepare(Props_DropDown as never);

const Props_MultiSelect = DBItemDropDownMultiSelector.propsV3({
	module: ModuleFE_PermissionDomain as never,
	itemRenderer: (item, onDelete) => {
		return !item ? <>Not Found</> : <><TS_Icons.x.component onClick={onDelete} className={'ts-icon__small'}/>{item.namespace}</>;
	},
	uiSelector: DropDown_PermissionDomain.selectable,
});

export const MultiSelect_PermissionDomain = TS_MultiSelect_V2.prepare(Props_MultiSelect);

